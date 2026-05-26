#[tauri::command]
fn download_update(url: String) -> Result<String, String> {
    let response = reqwest::blocking::get(&url)
        .map_err(|e| format!("下载失败: {}", e))?;

    let bytes = response.bytes()
        .map_err(|e| format!("读取响应失败: {}", e))?;

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

    let current_exe = std::env::current_exe()
        .map_err(|e| format!("获取当前路径失败: {}", e))?;

    let bat_content = format!(
        "@echo off\r\n\
         :loop\r\n\
         tasklist /FI \"IMAGENAME eq shuati.exe\" 2>NUL | find /I /N \"shuati.exe\" >NUL\r\n\
         if \"%ERRORLEVEL%\"==\"0\" (\r\n\
           timeout /t 1 /nobreak >NUL\r\n\
           goto loop\r\n\
         )\r\n\
         copy /Y \"{}\" \"{}\" >NUL\r\n\
         if errorlevel 1 (\r\n\
           echo Update failed > \"%TEMP%\\update_error.txt\"\r\n\
           exit /b 1\r\n\
         )\r\n\
         start \"\" \"{}\"\r\n\
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
