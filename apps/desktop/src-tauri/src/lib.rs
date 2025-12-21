//! Game View Desktop - Tauri Backend
//!
//! This module provides the Rust backend for the Game View desktop application.
//! It handles file operations, CLI spawning, and settings management.

mod commands;
mod settings;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize app data directory
            let app_data = app.path().app_data_dir().expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data).ok();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::pick_videos,
            commands::pick_output_directory,
            commands::process_videos,
            commands::cancel_processing,
            commands::get_cli_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
