//! Tauri Commands
//!
//! This module contains all the Tauri commands that can be invoked from the frontend.

use crate::settings::AppSettings;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Manager};

// Global cancellation flag for processing
static CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessArgs {
    pub videos: Vec<String>,
    pub output_dir: String,
    pub preset: String,
    pub colmap_path: Option<String>,
    pub brush_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessProgress {
    pub stage: String,
    pub progress: f64,
    pub message: Option<String>,
}

/// Get application settings
#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let settings_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("settings.json");

    if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    } else {
        Ok(AppSettings::default())
    }
}

/// Save application settings
#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let settings_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("settings.json");

    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(&settings_path, content).map_err(|e| e.to_string())
}

/// Open file dialog to pick video files
#[tauri::command]
pub async fn pick_videos() -> Result<Vec<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    // Note: This is a placeholder - actual implementation would use the dialog plugin
    // The dialog plugin's API differs slightly in Tauri 2.0
    Ok(vec![])
}

/// Open file dialog to pick output directory
#[tauri::command]
pub async fn pick_output_directory() -> Result<Option<String>, String> {
    // Note: This is a placeholder - actual implementation would use the dialog plugin
    Ok(None)
}

/// Get the path to the bundled gvcore-cli executable
#[tauri::command]
pub async fn get_cli_path(app: AppHandle) -> Result<String, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    let cli_name = "gvcore-cli.exe";

    #[cfg(not(target_os = "windows"))]
    let cli_name = "gvcore-cli";

    let cli_path = resource_dir.join("resources").join(cli_name);

    if cli_path.exists() {
        Ok(cli_path.to_string_lossy().to_string())
    } else {
        // Fall back to system PATH
        Ok(cli_name.to_string())
    }
}

/// Process videos using gvcore-cli
#[tauri::command]
pub async fn process_videos(app: AppHandle, args: ProcessArgs) -> Result<String, String> {
    use std::process::Stdio;
    use tokio::io::{AsyncBufReadExt, BufReader};
    use tokio::process::Command;

    // Reset cancellation flag
    CANCEL_FLAG.store(false, Ordering::SeqCst);

    let cli_path = get_cli_path(app.clone()).await?;

    // Build command arguments
    let mut cmd_args = vec![
        "process".to_string(),
        "--output".to_string(),
        args.output_dir.clone(),
        "--preset".to_string(),
        args.preset,
    ];

    for video in &args.videos {
        cmd_args.push("--video".to_string());
        cmd_args.push(video.clone());
    }

    if let Some(colmap) = args.colmap_path {
        cmd_args.push("--colmap-path".to_string());
        cmd_args.push(colmap);
    }

    if let Some(brush) = args.brush_path {
        cmd_args.push("--brush-path".to_string());
        cmd_args.push(brush);
    }

    // Spawn the CLI process
    let mut child = Command::new(&cli_path)
        .args(&cmd_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn CLI: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let mut reader = BufReader::new(stdout).lines();

    // Stream output to frontend
    while let Some(line) = reader.next_line().await.map_err(|e| e.to_string())? {
        // Check for cancellation
        if CANCEL_FLAG.load(Ordering::SeqCst) {
            child.kill().await.ok();
            return Err("Processing cancelled".to_string());
        }

        // Try to parse as JSON progress
        if let Ok(progress) = serde_json::from_str::<ProcessProgress>(&line) {
            app.emit("processing-progress", &progress).ok();
        }
    }

    let status = child.wait().await.map_err(|e| e.to_string())?;

    if status.success() {
        // Return path to output PLY file
        let output_path = PathBuf::from(&args.output_dir)
            .join("output.ply")
            .to_string_lossy()
            .to_string();
        Ok(output_path)
    } else {
        Err(format!("CLI exited with status: {}", status))
    }
}

/// Cancel ongoing processing
#[tauri::command]
pub async fn cancel_processing() -> Result<(), String> {
    CANCEL_FLAG.store(true, Ordering::SeqCst);
    Ok(())
}
