#![recursion_limit = "512"]

mod assembler;
mod commands;
mod comfyui;
mod ffmpeg;
mod local_server;

#[cfg(test)]
mod comfyui_test;

#[tauri::command]
async fn generate_ltx_video(
    params: comfyui::VideoParams,
    save_path: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let video_bytes = comfyui::generate_video_with_progress(params, app_handle).await?;
    std::fs::write(&save_path, &video_bytes).map_err(|e| e.to_string())?;
    Ok(save_path)
}

#[tauri::command]
async fn cancel_video_generation() -> Result<(), String> {
    comfyui::cancel_generation().await
}

#[tauri::command]
async fn get_queue_status() -> Result<serde_json::Value, String> {
    comfyui::get_queue_status().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                local_server::start_local_server(handle).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_app_version,
            commands::save_file,
            commands::open_folder,
            commands::send_notification,
            commands::check_ffmpeg,
            ffmpeg::get_ffmpeg_path,
            ffmpeg::get_video_info,
            ffmpeg::extract_thumbnails,
            ffmpeg::cut_video,
            ffmpeg::export_with_effects,
            generate_ltx_video,
            cancel_video_generation,
            get_queue_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
