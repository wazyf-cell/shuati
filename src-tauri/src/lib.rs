use std::process::Command;
use std::time::Duration;

#[tauri::command]
fn check_update_v2() -> Result<String, String> {
    let url = "https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/version.json";
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("创建客户端失败: {}", e))?;

    let response = client
        .get(url)
        .header("Accept", "application/json,text/plain,*/*")
        .header("Cache-Control", "no-cache")
        .send()
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().unwrap_or_default();
        return Err(format!(
            "HTTP {} — {}",
            status.as_u16(),
            &body[..body.len().min(300)]
        ));
    }

    response.text()
        .map_err(|e| format!("读取响应失败: {}", e))
}

#[tauri::command]
fn check_update(url: String) -> Result<String, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(8))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("创建客户端失败: {}", e))?;

    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .send()
        .map_err(|e| format!("请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().unwrap_or_default();
        return Err(format!("服务器返回错误: {} - {}", status, &body[..body.len().min(200)]));
    }

    let text = response.text()
        .map_err(|e| format!("读取响应失败: {}", e))?;

    Ok(text)
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    Command::new("cmd")
        .args(&["/c", "start", "", &url])
        .spawn()
        .map_err(|e| format!("打开链接失败: {}", e))?;
    Ok(())
}

#[tauri::command]
fn download_update(url: String) -> Result<String, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(60))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
        .danger_accept_invalid_certs(false)
        .build()
        .map_err(|e| format!("创建客户端失败: {}", e))?;

    // 尝试带 referer 请求
    let response = client
        .get(&url)
        .header("Referer", "https://gitee.com/")
        .header("Accept", "application/octet-stream,application/x-msdownload,*/*")
        .send()
        .map_err(|e| format!("下载失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().unwrap_or_default();
        return Err(format!("服务器返回错误: {} - {}", status, &body[..body.len().min(200)]));
    }

    let bytes = response.bytes()
        .map_err(|e| format!("读取响应失败: {}", e))?;

    if bytes.len() < 1024 {
        return Err(format!("下载文件太小 ({} 字节)，可能不是有效的程序", bytes.len()));
    }

    let temp_dir = std::env::temp_dir();
    let exe_path = temp_dir.join("shuati_update.exe");

    std::fs::write(&exe_path, &bytes)
        .map_err(|e| format!("写入文件失败: {}", e))?;

    exe_path.to_str().map(|s| s.to_string())
        .ok_or_else(|| "路径转换失败".to_string())
}

#[tauri::command]
fn apply_update(app_handle: tauri::AppHandle) -> Result<(), String> {
    let temp_dir = std::env::temp_dir();
    let new_exe = temp_dir.join("shuati_update.exe");
    let bat_path = temp_dir.join("update_shuati.bat");

    // 验证下载文件存在且有效
    if !new_exe.exists() {
        return Err("更新文件不存在，请先检查更新".to_string());
    }
    let file_size = std::fs::metadata(&new_exe)
        .map_err(|e| format!("读取文件信息失败: {}", e))?
        .len();
    if file_size < 1024 * 1024 {
        return Err(format!("更新文件异常 ({} 字节)，放弃更新", file_size));
    }

    let current_exe = std::env::current_exe()
        .map_err(|e| format!("获取当前路径失败: {}", e))?;

    let bat_content = format!(
        "@echo off\r\n\
         chcp 65001 >NUL\r\n\
         echo Waiting for app to exit... > \"%TEMP%\\update_log.txt\"\r\n\
         :loop\r\n\
         tasklist /FI \"IMAGENAME eq shuati.exe\" 2>NUL | find /I /N \"shuati.exe\" >NUL\r\n\
         if \"%ERRORLEVEL%\"==\"0\" (\r\n\
           timeout /t 1 /nobreak >NUL\r\n\
           goto loop\r\n\
         )\r\n\
         echo Replacing file... >> \"%TEMP%\\update_log.txt\"\r\n\
         move /Y \"{}\" \"{}\" >> \"%TEMP%\\update_log.txt\" 2>&1\r\n\
         if errorlevel 1 (\r\n\
           echo MOVE FAILED >> \"%TEMP%\\update_error.txt\"\r\n\
           exit /b 1\r\n\
         )\r\n\
         echo Starting new version... >> \"%TEMP%\\update_log.txt\"\r\n\
         start \"\" \"{}\"\r\n\
         echo Done >> \"%TEMP%\\update_log.txt\"\r\n\
         del \"%~f0\"\r\n",
        new_exe.display(),
        current_exe.display(),
        current_exe.display()
    );

    std::fs::write(&bat_path, bat_content)
        .map_err(|e| format!("写入批处理文件失败: {}", e))?;

    std::process::Command::new("cmd")
        .args(&["/c", bat_path.to_str().unwrap()])
        .spawn()
        .map_err(|e| format!("启动更新脚本失败: {}", e))?;

    app_handle.exit(0);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
      check_update_v2,
      check_update,
      open_url,
      download_update,
      apply_update,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
