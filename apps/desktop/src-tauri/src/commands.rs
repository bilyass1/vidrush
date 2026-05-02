use std::process::Command;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
pub async fn save_file(path: String, data: Vec<u8>) -> Result<(), String> {
    std::fs::write(&path, &data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), String> {
    let cmd = if cfg!(target_os = "windows") {
        "explorer.exe"
    } else if cfg!(target_os = "macos") {
        "open"
    } else {
        "xdg-open"
    };

    Command::new(cmd)
        .arg(&path)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn send_notification(
    app: AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_ffmpeg(app: AppHandle) -> bool {
    crate::ffmpeg::find_ffmpeg_bin(&app).is_ok()
}
