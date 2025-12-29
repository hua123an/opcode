use std::path::PathBuf;

/// Gets the path to the ~/.claude directory
pub fn get_claude_dir() -> Result<PathBuf, String> {
    dirs::home_dir()
        .ok_or_else(|| "Could not find home directory".to_string())
        .and_then(|home| {
            home.join(".claude")
                .canonicalize()
                .map_err(|_| "Could not find ~/.claude directory".to_string())
        })
}
