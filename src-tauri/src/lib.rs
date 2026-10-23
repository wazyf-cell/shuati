use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter, Manager, State};

const RELEASES_API: &str = "https://api.github.com/repos/wazyf-cell/shuati/releases/latest";
const USER_AGENT: &str = "shuati-updater/1.0";

struct DownloadState {
    cancelled: Arc<AtomicBool>,
    active: Arc<AtomicBool>,
}

#[derive(Clone, Serialize)]
struct DownloadProgress {
    downloaded: u64,
    total: u64,
    percent: u32,
}

fn emit_progress(app: &AppHandle, downloaded: u64, total: u64) {
    let percent = if total > 0 {
        ((downloaded as f64 / total as f64) * 100.0).min(100.0) as u32
    } else {
        0
    };
    let _ = app.emit(
        "update-download-progress",
        DownloadProgress {
            downloaded,
            total,
            percent,
        },
    );
}

fn to_hex(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push_str(&format!("{:02x}", byte));
    }
    out
}

#[tauri::command]
async fn fetch_latest_release() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(15))
            .user_agent(USER_AGENT)
            .build()
            .map_err(|e| format!("创建客户端失败: {e}"))?;

        let response = client
            .get(RELEASES_API)
            .header("Accept", "application/vnd.github+json")
            .header("X-GitHub-Api-Version", "2022-11-28")
            .header("Cache-Control", "no-cache")
            .send()
            .map_err(|e| format!("网络请求失败: {e}"))?;

        let status = response.status();
        if status.as_u16() == 404 {
            return Err("还没有发布任何 Release".into());
        }
        if status.as_u16() == 403 {
            return Err("GitHub API 请求过于频繁，请稍后重试".into());
        }
        if !status.is_success() {
            let body = response.text().unwrap_or_default();
            return Err(format!(
                "GitHub 返回 HTTP {} — {}",
                status.as_u16(),
                &body[..body.len().min(300)]
            ));
        }

        response
            .text()
            .map_err(|e| format!("读取响应失败: {e}"))
    })
    .await
    .map_err(|e| format!("请求线程失败: {e}"))?
}

#[tauri::command]
async fn fetch_text(url: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(15))
            .user_agent(USER_AGENT)
            .build()
            .map_err(|e| format!("创建客户端失败: {e}"))?;

        let response = client
            .get(&url)
            .header("Accept", "text/plain,*/*")
            .send()
            .map_err(|e| format!("请求失败: {e}"))?;

        let status = response.status();
        if !status.is_success() {
            return Err(format!("服务器返回 HTTP {}", status.as_u16()));
        }

        let bytes = response
            .bytes()
            .map_err(|e| format!("读取响应失败: {e}"))?;
        if bytes.len() > 2 * 1024 * 1024 {
            return Err("校验文件过大".into());
        }
        String::from_utf8(bytes.to_vec()).map_err(|e| format!("校验文件不是 UTF-8: {e}"))
    })
    .await
    .map_err(|e| format!("请求线程失败: {e}"))?
}

#[tauri::command]
fn can_replace_exe() -> bool {
    let Ok(exe) = std::env::current_exe() else {
        return false;
    };
    let Some(dir) = exe.parent() else {
        return false;
    };
    let test = dir.join(".shuati-write-test");
    match std::fs::write(&test, b"ok") {
        Ok(_) => {
            let _ = std::fs::remove_file(&test);
            true
        }
        Err(_) => false,
    }
}

fn download_asset_blocking(
    app: AppHandle,
    cancelled: Arc<AtomicBool>,
    active: Arc<AtomicBool>,
    url: String,
    expected_sha256: String,
    file_name: String,
) -> Result<String, String> {
    if active.swap(true, Ordering::SeqCst) {
        return Err("已有下载任务正在进行".into());
    }

    let result = (|| -> Result<String, String> {
        let safe_name = Path::new(&file_name)
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("");
        if safe_name.is_empty() || safe_name != file_name.as_str() {
            return Err("非法文件名".into());
        }

        let dir = std::env::temp_dir().join("shuati-updates");
        std::fs::create_dir_all(&dir).map_err(|e| format!("创建临时目录失败: {e}"))?;
        let out_path = dir.join(safe_name);
        let _ = std::fs::remove_file(&out_path);

        cancelled.store(false, Ordering::SeqCst);

        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(180))
            .user_agent(USER_AGENT)
            .build()
            .map_err(|e| format!("创建客户端失败: {e}"))?;

        let mut response = client
            .get(&url)
            .header("Accept", "application/octet-stream,*/*")
            .send()
            .map_err(|e| format!("下载失败: {e}"))?;

        let status = response.status();
        if !status.is_success() {
            return Err(format!("服务器返回 HTTP {}", status.as_u16()));
        }

        let total = response.content_length().unwrap_or(0);
        let mut file = File::create(&out_path).map_err(|e| format!("创建文件失败: {e}"))?;
        let mut hasher = Sha256::new();
        let mut downloaded: u64 = 0;
        let mut last_emit = Instant::now() - Duration::from_secs(1);
        let mut buffer = [0u8; 64 * 1024];

        loop {
            if cancelled.load(Ordering::SeqCst) {
                drop(file);
                let _ = std::fs::remove_file(&out_path);
                return Err("已取消".into());
            }

            let read = response
                .read(&mut buffer)
                .map_err(|e| format!("读取数据失败: {e}"))?;
            if read == 0 {
                break;
            }

            file.write_all(&buffer[..read])
                .map_err(|e| format!("写入文件失败: {e}"))?;
            hasher.update(&buffer[..read]);
            downloaded += read as u64;

            if last_emit.elapsed() >= Duration::from_millis(150) {
                last_emit = Instant::now();
                emit_progress(&app, downloaded, total);
            }
        }

        file.flush().map_err(|e| format!("写入文件失败: {e}"))?;
        drop(file);

        if downloaded < 1024 {
            let _ = std::fs::remove_file(&out_path);
            return Err(format!("下载文件太小 ({downloaded} 字节)"));
        }

        emit_progress(&app, downloaded, total.max(downloaded));

        let actual = to_hex(hasher.finalize().as_slice());
        let expected = expected_sha256.trim();
        if !expected.is_empty() && !actual.eq_ignore_ascii_case(expected) {
            let _ = std::fs::remove_file(&out_path);
            return Err(format!("SHA256 校验失败：期望 {expected}，实际 {actual}"));
        }

        log::info!(
            "download ok: {} ({} bytes, sha256={})",
            out_path.display(),
            downloaded,
            actual
        );
        Ok(out_path.to_string_lossy().to_string())
    })();

    active.store(false, Ordering::SeqCst);
    cancelled.store(false, Ordering::SeqCst);
    result
}

#[tauri::command]
async fn download_asset(
    app: AppHandle,
    state: State<'_, DownloadState>,
    url: String,
    expected_sha256: String,
    file_name: String,
) -> Result<String, String> {
    let cancelled = state.cancelled.clone();
    let active = state.active.clone();
    tauri::async_runtime::spawn_blocking(move || {
        download_asset_blocking(app, cancelled, active, url, expected_sha256, file_name)
    })
    .await
    .map_err(|e| format!("下载线程失败: {e}"))?
}

#[tauri::command]
fn cancel_download(state: State<'_, DownloadState>) -> Result<(), String> {
    if state.active.load(Ordering::SeqCst) {
        state.cancelled.store(true, Ordering::SeqCst);
    }
    Ok(())
}

fn ps_quote(path: &Path) -> String {
    format!("'{}'", path.to_string_lossy().replace('\'', "''"))
}

fn build_update_script(
    mode: &str,
    new_file: &Path,
    current_exe: &Path,
    pid: u32,
    log_path: &Path,
) -> Result<String, String> {
    let new_q = ps_quote(new_file);
    let current_q = ps_quote(current_exe);
    let log_q = ps_quote(log_path);
    let log_dir_q = ps_quote(log_path.parent().unwrap_or(Path::new(".")));

    let action = match mode {
        "setup" => format!("Start-Process -FilePath {new_q}"),
        "replace" => format!(
            "try {{\r\n  Copy-Item -LiteralPath {new_q} -Destination {current_q} -Force\r\n  Start-Process -FilePath {current_q}\r\n  Remove-Item -LiteralPath {new_q} -Force -ErrorAction SilentlyContinue\r\n  Add-Content -LiteralPath {log_q} -Value ('replace ok ' + (Get-Date -Format o))\r\n}} catch {{\r\n  Add-Content -LiteralPath {log_q} -Value ('replace failed: ' + $_.Exception.Message)\r\n  Start-Process -FilePath {current_q}\r\n}}"
        ),
        _ => return Err(format!("未知更新模式: {mode}")),
    };

    Ok(format!(
        "$ErrorActionPreference = 'Stop'\r\nNew-Item -ItemType Directory -Force -Path {log_dir_q} | Out-Null\r\nwhile (Get-Process -Id {pid} -ErrorAction SilentlyContinue) {{ Start-Sleep -Milliseconds 300 }}\r\n{action}\r\nRemove-Item -LiteralPath $PSCommandPath -Force -ErrorAction SilentlyContinue\r\n"
    ))
}

#[tauri::command]
fn apply_update(app: AppHandle, path: String, mode: String) -> Result<(), String> {
    let new_file = PathBuf::from(&path);
    if !new_file.exists() {
        return Err("更新文件不存在".into());
    }
    let size = std::fs::metadata(&new_file)
        .map_err(|e| format!("读取文件信息失败: {e}"))?
        .len();
    if size < 1024 * 1024 {
        return Err(format!("更新文件异常 ({size} 字节)"));
    }

    let current_exe = std::env::current_exe().map_err(|e| format!("获取当前路径失败: {e}"))?;
    let pid = std::process::id();
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("获取日志目录失败: {e}"))?;
    let _ = std::fs::create_dir_all(&log_dir);
    let helper_log = log_dir.join("update-helper.log");

    let script = build_update_script(&mode, &new_file, &current_exe, pid, &helper_log)?;
    let script_path = std::env::temp_dir().join(format!("shuati-update-{pid}.ps1"));
    std::fs::write(&script_path, format!("\u{feff}{script}"))
        .map_err(|e| format!("写入更新脚本失败: {e}"))?;

    log::info!(
        "apply_update mode={} file={} script={}",
        mode,
        new_file.display(),
        script_path.display()
    );

    Command::new("powershell")
        .args([
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-WindowStyle",
            "Hidden",
            "-File",
        ])
        .arg(&script_path)
        .spawn()
        .map_err(|e| format!("启动更新脚本失败: {e}"))?;

    app.exit(0);
    Ok(())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    let lower = url.to_ascii_lowercase();
    if !lower.starts_with("https://") && !lower.starts_with("http://") {
        return Err("只允许打开 http/https 链接".into());
    }
    Command::new("rundll32.exe")
        .arg("url.dll,FileProtocolHandler")
        .arg(&url)
        .spawn()
        .map_err(|e| format!("打开链接失败: {e}"))?;
    Ok(())
}

#[tauri::command]
fn open_log_dir(app: AppHandle) -> Result<(), String> {
    let dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("获取日志目录失败: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建日志目录失败: {e}"))?;
    Command::new("explorer")
        .arg(&dir)
        .spawn()
        .map_err(|e| format!("打开日志目录失败: {e}"))?;
    Ok(())
}

#[tauri::command]
fn log_frontend(message: String) {
    log::error!("[frontend] {message}");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("shuati".into()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                ])
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(DownloadState {
            cancelled: Arc::new(AtomicBool::new(false)),
            active: Arc::new(AtomicBool::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            fetch_latest_release,
            fetch_text,
            can_replace_exe,
            download_asset,
            cancel_download,
            apply_update,
            open_url,
            open_log_dir,
            log_frontend,
        ])
        .setup(|app| {
            log::info!(
                "shuati {} started, exe={:?}",
                app.package_info().version,
                std::env::current_exe()
            );
            std::panic::set_hook(Box::new(|info| {
                log::error!("panic: {info}");
            }));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
