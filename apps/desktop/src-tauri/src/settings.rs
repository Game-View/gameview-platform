//! Settings Management
//!
//! Handles application settings persistence.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub default_output_dir: String,
    pub default_preset: String,
    pub colmap_path: Option<String>,
    pub brush_path: Option<String>,
    pub recent_productions: Vec<RecentProduction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentProduction {
    pub id: String,
    pub name: String,
    pub path: String,
    pub last_opened: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            default_output_dir: String::new(),
            default_preset: "balanced".to_string(),
            colmap_path: None,
            brush_path: None,
            recent_productions: vec![],
        }
    }
}
