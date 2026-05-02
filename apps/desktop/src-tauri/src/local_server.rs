use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tokio::net::TcpListener;

use crate::assembler::{assemble_video, AssemblyInstructions, AssemblyResult};

// ── Shared state ──────────────────────────────────────────────────────────────

#[derive(Clone)]
struct ServerState {
    app: AppHandle,
    /// PID of the currently running ffmpeg process (for /cancel).
    current_pid: Arc<Mutex<Option<u32>>>,
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async fn handle_health() -> Json<Value> {
    Json(json!({ "status": "ok", "version": "1.0.0" }))
}

async fn handle_assemble(
    State(state): State<ServerState>,
    Json(instructions): Json<AssemblyInstructions>,
) -> Result<Json<AssemblyResult>, (StatusCode, Json<Value>)> {
    match assemble_video(instructions, state.app.clone()).await {
        Ok(result) => Ok(Json(result)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e })),
        )),
    }
}

async fn handle_cancel(
    State(state): State<ServerState>,
) -> Json<Value> {
    let pid = state.current_pid.lock().unwrap().take();
    if let Some(pid) = pid {
        // Best-effort kill
        #[cfg(unix)]
        unsafe { libc::kill(pid as i32, libc::SIGTERM); }
        #[cfg(windows)]
        { let _ = std::process::Command::new("taskkill").args(["/PID", &pid.to_string(), "/F"]).output(); }
    }
    Json(json!({ "cancelled": true }))
}

// ── Server startup ────────────────────────────────────────────────────────────

pub async fn start_local_server(app: AppHandle) {
    let state = ServerState {
        app,
        current_pid: Arc::new(Mutex::new(None)),
    };

    let router = Router::new()
        .route("/health", get(handle_health))
        .route("/assemble", post(handle_assemble))
        .route("/cancel", post(handle_cancel))
        .with_state(state);

    match TcpListener::bind("127.0.0.1:1422").await {
        Ok(listener) => {
            println!("Local server started on port 1422");
            if let Err(e) = axum::serve(listener, router).await {
                eprintln!("Local server error: {e}");
            }
        }
        Err(e) => eprintln!("Failed to bind port 1422: {e}"),
    }
}
