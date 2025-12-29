use anyhow::Result;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use std::env;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub display_name: String,
    pub created_at: String,
    #[serde(rename = "type")]
    pub model_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelsResponse {
    pub data: Vec<ModelInfo>,
    pub has_more: bool,
    pub first_id: Option<String>,
    pub last_id: Option<String>,
}

#[command]
pub async fn list_anthropic_models(api_key: Option<String>) -> Result<ModelsResponse, String> {
    let key = if let Some(k) = api_key {
        k
    } else {
        // Try env vars
        env::var("ANTHROPIC_API_KEY")
            .or_else(|_| env::var("CLAUDE_API_KEY"))
            .map_err(|_| "No API key provided and none found in environment variables".to_string())?
    };

    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", HeaderValue::from_str(&key).map_err(|e| e.to_string())?);
    headers.insert("anthropic-version", HeaderValue::from_static("2023-06-01"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let res = client
        .get("https://api.anthropic.com/v1/models")
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let error_text = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API request failed: {}", error_text));
    }

    let body = res.json::<ModelsResponse>().await.map_err(|e| e.to_string())?;
    Ok(body)
}
