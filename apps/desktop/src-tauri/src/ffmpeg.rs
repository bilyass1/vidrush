use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

// ── Structs ──────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize)]
pub struct VideoInfo {
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub size_bytes: u64,
    pub format: String,
}

#[derive(Serialize, Deserialize)]
pub struct Cut {
    pub start_sec: f64,
    pub end_sec: f64,
}

#[derive(Serialize, Deserialize)]
pub struct Overlay {
    pub overlay_type: String, // "text" | "image"
    pub x: i32,
    pub y: i32,
    pub content: String, // text string or image file path
    pub start_t: f64,
    pub end_t: f64,
    pub font_size: Option<u32>,
    pub color: Option<String>, // hex e.g. "ffffff"
}

#[derive(Serialize, Deserialize)]
pub struct ExportInstructions {
    pub input_path: String,
    pub output_path: String,
    pub cuts: Vec<Cut>,
    pub overlays: Vec<Overlay>,
    pub volume: f32,
    pub speed: f32,
    pub format: String, // "mp4" | "webm"
    pub output_width: Option<u32>,
    pub output_height: Option<u32>,
    pub target_fps: Option<u32>,  // e.g. 30 — normalise frame rate
    pub crf: Option<u32>,
    pub audio_bitrate: Option<String>,
    pub audio_tracks: Vec<AudioTrack>,
}

#[derive(Serialize, Deserialize)]
pub struct AudioTrack {
    pub path: String,
    pub start_t: f64,
    pub offset_t: f64,
    pub duration: f64,
    pub volume: f32,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

pub fn find_ffmpeg_bin(app: &AppHandle) -> Result<PathBuf, String> {
    find_binary(app, "ffmpeg")
}

pub fn find_ffprobe_bin(app: &AppHandle) -> Result<PathBuf, String> {
    find_binary(app, "ffprobe")
}

fn find_binary(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    let bin_name = if cfg!(target_os = "windows") {
        format!("{}.exe", name)
    } else {
        name.to_string()
    };

    // 1. Bundled path inside resource dir
    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled = resource_dir.join(&bin_name);
        if bundled.exists() {
            return Ok(bundled);
        }
    }

    // 2. Development path (tools/ffmpeg/bin or tools/ffmpeg)
    // We check relative to current working directory AND walk up to find the project root
    let mut current_dir = std::env::current_dir().ok();
    while let Some(dir) = current_dir {
        let paths_to_check = [
            dir.join("tools").join("ffmpeg").join(&bin_name),
            dir.join("tools").join("ffmpeg").join("bin").join(&bin_name),
            // Also check for a flat structure if extracted differently
            dir.join("ffmpeg").join(&bin_name),
        ];

        for path in paths_to_check {
            if path.exists() {
                return Ok(path);
            }
        }

        current_dir = dir.parent().map(|p| p.to_path_buf());
    }

    // 3. System PATH
    let which_cmd = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };

    if let Ok(out) = Command::new(which_cmd).arg(name).output() {
        if out.status.success() {
            let path_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let first_path = path_str.lines().next().unwrap_or("").to_string();
            if !first_path.is_empty() {
                return Ok(PathBuf::from(first_path));
            }
        }
    }

    Err(format!("{} not found in bundled resources, tools directory, or system PATH", name))
}

/// Strip a trailing FFmpeg filter label like `[scv0]` from a filter string.
/// Used when converting filter_complex filters to -vf format.
fn regex_strip_label(s: &str) -> String {
    // Remove trailing [label] — find last '[' and strip from there if it's at the end
    if let Some(pos) = s.rfind('[') {
        if s[pos..].ends_with(']') && !s[pos..].contains(',') {
            return s[..pos].to_string();
        }
    }
    s.to_string()
}

/// Parse "HH:MM:SS.ms" from an ffmpeg progress line into seconds.
fn parse_time_secs(line: &str) -> Option<f64> {
    let pos = line.find("time=")?;
    let rest = &line[pos + 5..];
    let end = rest.find(' ').unwrap_or(rest.len());
    let time_str = &rest[..end];
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() == 3 {
        let h: f64 = parts[0].parse().ok()?;
        let m: f64 = parts[1].parse().ok()?;
        let s: f64 = parts[2].parse().ok()?;
        Some(h * 3600.0 + m * 60.0 + s)
    } else {
        None
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────

/// Return the path to the ffmpeg binary: bundled resource first, then system PATH.
#[tauri::command]
pub async fn get_ffmpeg_path(app: AppHandle) -> Result<String, String> {
    find_ffmpeg_bin(&app)
        .map(|p| p.to_string_lossy().to_string())
}

/// Extract metadata from a video file using ffprobe.
#[tauri::command]
pub async fn get_video_info(app: AppHandle, video_path: String) -> Result<VideoInfo, String> {
    let bin = find_ffprobe_bin(&app)?;
    let out = Command::new(bin)
        .args([
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_streams",
            "-show_format",
            "-i",
            &video_path,
        ])
        .output()
        .map_err(|e| format!("Failed to run ffprobe: {e}"))?;

    if !out.status.success() {
        return Err(format!(
            "ffprobe failed: {}",
            String::from_utf8_lossy(&out.stderr)
        ));
    }

    let json: serde_json::Value =
        serde_json::from_slice(&out.stdout).map_err(|e| format!("Parse error: {e}"))?;

    let streams = json["streams"]
        .as_array()
        .ok_or("No streams found in ffprobe output")?;

    let video_stream = streams
        .iter()
        .find(|s| s["codec_type"].as_str() == Some("video"))
        .ok_or("No video stream found")?;

    let width = video_stream["width"].as_u64().unwrap_or(0) as u32;
    let height = video_stream["height"].as_u64().unwrap_or(0) as u32;

    // r_frame_rate is "30/1" or "30000/1001"
    let fps = video_stream["r_frame_rate"]
        .as_str()
        .and_then(|r| {
            let mut it = r.split('/');
            let num: f64 = it.next()?.parse().ok()?;
            let den: f64 = it.next()?.parse().ok()?;
            if den != 0.0 {
                Some(num / den)
            } else {
                None
            }
        })
        .unwrap_or(0.0);

    let duration = json["format"]["duration"]
        .as_str()
        .and_then(|d| d.parse::<f64>().ok())
        .unwrap_or(0.0);

    let size_bytes = json["format"]["size"]
        .as_str()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);

    // "mov,mp4,m4a,..." → take the first token
    let format = json["format"]["format_name"]
        .as_str()
        .unwrap_or("unknown")
        .split(',')
        .next()
        .unwrap_or("unknown")
        .to_string();

    Ok(VideoInfo {
        duration,
        width,
        height,
        fps,
        size_bytes,
        format,
    })
}

/// Extract `count` evenly-spaced thumbnail JPEGs from a video in parallel.
#[tauri::command]
pub async fn extract_thumbnails(
    app: AppHandle,
    video_path: String,
    output_dir: String,
    count: u32,
) -> Result<Vec<String>, String> {
    let info = get_video_info(app.clone(), video_path.clone()).await?;
    let duration = info.duration;
    let interval = duration / count as f64;

    std::fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Cannot create output dir: {e}"))?;

    // Spawn one blocking task per thumbnail so they run in parallel.
    let mut handles = Vec::with_capacity(count as usize);

    for n in 0..count {
        // Sample the centre of each interval
        let timestamp = interval * n as f64 + interval / 2.0;
        let vpath = video_path.clone();
        let out_path = format!("{}/thumb_{}.jpg", output_dir, n);
        let bin = find_ffmpeg_bin(&app)?;

        let handle = tokio::task::spawn_blocking(move || {
            let result = Command::new(bin)
                .args([
                    "-ss",
                    &timestamp.to_string(),
                    "-i",
                    &vpath,
                    "-vframes",
                    "1",
                    "-q:v",
                    "2",
                    &out_path,
                    "-y",
                ])
                .output()
                .map_err(|e| format!("ffmpeg error: {e}"))?;

            if !result.status.success() {
                return Err(format!(
                    "ffmpeg thumbnail {} failed: {}",
                    n,
                    String::from_utf8_lossy(&result.stderr)
                ));
            }
            Ok(out_path)
        });

        handles.push(handle);
    }

    let mut paths = Vec::with_capacity(count as usize);
    for handle in handles {
        let path = handle
            .await
            .map_err(|e| format!("Task join error: {e}"))??;
        paths.push(path);
    }

    // Return in order (thumb_0, thumb_1, …)
    paths.sort();
    Ok(paths)
}

/// Cut a video segment without re-encoding.
#[tauri::command]
pub async fn cut_video(
    app: AppHandle,
    input_path: String,
    output_path: String,
    start_sec: f64,
    end_sec: f64,
) -> Result<(), String> {
    let bin = find_ffmpeg_bin(&app)?;
    let out = Command::new(bin)
        .args([
            "-ss",
            &start_sec.to_string(),
            "-to",
            &end_sec.to_string(),
            "-i",
            &input_path,
            "-c",
            "copy",
            &output_path,
            "-y",
        ])
        .output()
        .map_err(|e| format!("Failed to run ffmpeg: {e}"))?;

    if !out.status.success() {
        return Err(format!(
            "cut_video failed: {}",
            String::from_utf8_lossy(&out.stderr)
        ));
    }
    Ok(())
}

/// Full export: cuts → speed → volume → text overlays → image overlays → encode.
/// Emits Tauri event "export_progress" (f32 0–100) while running.
#[tauri::command]
pub async fn export_with_effects(
    app: AppHandle,
    instructions: ExportInstructions,
) -> Result<String, String> {
    // ── Collect image overlay paths so we know all inputs upfront ──────────
    let image_overlays: Vec<&Overlay> = instructions
        .overlays
        .iter()
        .filter(|o| o.overlay_type == "image")
        .collect();

    // ── Build the ffmpeg argument list ─────────────────────────────────────
    let mut args: Vec<String> = Vec::new();

    // Main input
    args.push("-i".to_string());
    args.push(instructions.input_path.clone());

    // Extra inputs for image overlays (referenced as [1:v], [2:v], …)
    for ov in &image_overlays {
        args.push("-i".to_string());
        args.push(ov.content.clone());
    }

    // Audio inputs
    for track in &instructions.audio_tracks {
        args.push("-i".to_string());
        args.push(track.path.clone());
    }

    // ── Build filter_complex ───────────────────────────────────────────────
    let mut filters: Vec<String> = Vec::new();
    let mut v = "[0:v]".to_string(); // current video label
    let mut a = "[0:a]".to_string(); // current audio label
    let mut idx: usize = 0; // unique suffix counter

    // Step 0 – Scale + FPS normalisation (if requested)
    let has_scale = instructions.output_width.is_some() && instructions.output_height.is_some();
    let has_fps   = instructions.target_fps.is_some();

    if has_scale || has_fps {
        let vout = format!("[scv{idx}]");
        // Build a comma-chained filtergraph node: [in]filter1,filter2,...[out]
        let mut chain: Vec<String> = Vec::new();

        if has_scale {
            let w = instructions.output_width.unwrap();
            let h = instructions.output_height.unwrap();
            chain.push(format!("scale={w}:{h}:force_original_aspect_ratio=decrease"));
            chain.push(format!("pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black"));
        }

        if has_fps {
            let fps = instructions.target_fps.unwrap();
            chain.push(format!("fps={fps}"));
        }

        filters.push(format!("{v}{}{vout}", chain.join(",")));
        v = vout;
        idx += 1;
    }

    // Step 1 – Cuts (concat filter)
    if !instructions.cuts.is_empty() {
        let n = instructions.cuts.len();
        let mut concat_in = String::new();

        for (i, cut) in instructions.cuts.iter().enumerate() {
            let vl = format!("[ctv{i}]");
            let al = format!("[cta{i}]");
            filters.push(format!(
                "{v}trim=start={}:end={},setpts=PTS-STARTPTS{vl}",
                cut.start_sec, cut.end_sec
            ));
            filters.push(format!(
                "{a}atrim=start={}:end={},asetpts=PTS-STARTPTS{al}",
                cut.start_sec, cut.end_sec
            ));
            concat_in.push_str(&format!("{vl}{al}"));
        }

        v = "[cv]".to_string();
        a = "[ca]".to_string();
        filters.push(format!("{concat_in}concat=n={n}:v=1:a=1{v}{a}"));
        idx += 1;
    }

    // Step 2 – Speed (setpts + atempo)
    if (instructions.speed - 1.0).abs() > 0.01 {
        let setpts = 1.0 / instructions.speed as f64;
        let vout = format!("[spv{idx}]");
        let aout = format!("[spa{idx}]");

        filters.push(format!("{v}setpts={setpts:.6}*PTS{vout}"));

        // atempo only accepts [0.5, 2.0]; chain two filters for values outside that
        let speed = instructions.speed as f64;
        if speed >= 0.5 && speed <= 2.0 {
            filters.push(format!("{a}atempo={speed:.6}{aout}"));
        } else if speed > 2.0 {
            let mid = format!("[spm{idx}]");
            filters.push(format!("{a}atempo=2.0{mid}"));
            filters.push(format!("{mid}atempo={:.6}{aout}", speed / 2.0));
        } else {
            // speed < 0.5
            let mid = format!("[spm{idx}]");
            filters.push(format!("{a}atempo=0.5{mid}"));
            filters.push(format!("{mid}atempo={:.6}{aout}", speed / 0.5));
        }

        v = vout;
        a = aout;
        idx += 1;
    }

    // Step 3 – Volume
    if (instructions.volume - 1.0).abs() > 0.01 {
        let aout = format!("[vol{idx}]");
        filters.push(format!("{a}volume={:.6}{aout}", instructions.volume));
        a = aout;
        idx += 1;
    }

    for (i, ov) in instructions
        .overlays
        .iter()
        .filter(|o| o.overlay_type == "text")
        .enumerate()
    {
        let vout = format!("[txt{idx}_{i}]");
        let size = ov.font_size.unwrap_or(24);
        let color = ov.color.as_deref().unwrap_or("ffffff");
        // Escape single-quotes in the text
        let text = ov.content.replace('\'', "'\\''");
        
        let mut effect = String::new();
        // Simple shadows/outlines
        effect.push_str(":shadowx=2:shadowy=2:shadowcolor=0x00000088");
        
        filters.push(format!(
            "{v}drawtext=text='{text}':x={}:y={}:fontsize={size}:\
             fontcolor=0x{color}{effect}:enable='between(t,{},{})'{vout}",
            ov.x, ov.y, ov.start_t, ov.end_t
        ));
        v = vout;
        idx += 1;
    }

    for (i, ov) in image_overlays.iter().enumerate() {
        let input_idx = i + 1; // main video is 0
        let vout = format!("[img{idx}_{i}]");
        filters.push(format!(
            "{v}[{input_idx}:v]overlay=x={}:y={}:enable='between(t,{},{})'{vout}",
            ov.x, ov.y, ov.start_t, ov.end_t
        ));
        v = vout;
        idx += 1;
    }

    // Step 6 – Audio tracks mixing
    if !instructions.audio_tracks.is_empty() {
        let mut mixed_audios = vec![a.clone()];
        let img_count = image_overlays.len();
        
        for (i, track) in instructions.audio_tracks.iter().enumerate() {
            let input_idx = 1 + img_count + i;
            let a_label = format!("[aud{i}]");
            let delay_ms = (track.start_t * 1000.0) as i64;
            
            filters.push(format!(
                "[{input_idx}:a]atrim=start={}:duration={},asetpts=PTS-STARTPTS,volume={:.2},adelay={delay_ms}|{delay_ms}{a_label}",
                track.offset_t, track.duration, track.volume
            ));
            mixed_audios.push(a_label);
        }
        
        let aout = format!("[amix{idx}]");
        let n = mixed_audios.len();
        filters.push(format!("{}amix=inputs={n}:duration=first:dropout_transition=2{aout}", mixed_audios.join("")));
        a = aout;
    }

    // ── Apply filter_complex (or skip if nothing to do) ────────────────────
    // Track whether audio went through the filter graph
    let audio_in_graph = a != "[0:a]";
    // Track whether video-only filters can use simpler -vf instead of -filter_complex
    let video_only_filters = !audio_in_graph && image_overlays.is_empty() && instructions.audio_tracks.is_empty();

    if !filters.is_empty() {
        if video_only_filters {
            // Use -vf (simpler, no label syntax needed) — strip the [0:v] prefix and [label] suffix
            let vf = filters.join(",")
                .trim_start_matches("[0:v]")
                .to_string();
            // Strip trailing label like [scv0], [spv1], etc.
            let vf = regex_strip_label(&vf);
            args.push("-vf".to_string());
            args.push(vf);
        } else {
            args.push("-filter_complex".to_string());
            args.push(filters.join(";"));
            args.push("-map".to_string());
            args.push(v.clone());
            if audio_in_graph {
                args.push("-map".to_string());
                args.push(a.clone());
            } else {
                args.push("-map".to_string());
                args.push("0:a?".to_string());
            }
        }
    }

    // If no filters at all, just map streams directly (no -vf, no -filter_complex)
    if filters.is_empty() {
        args.push("-map".to_string());
        args.push("0:v".to_string());
        args.push("-map".to_string());
        args.push("0:a?".to_string());
    }

    // Step 6 – Encoder
    match instructions.format.as_str() {
        "webm" => {
            args.extend([
                "-c:v".to_string(),
                "libvpx-vp9".to_string(),
                "-crf".to_string(),
                "30".to_string(),
                "-b:v".to_string(),
                "0".to_string(),
                "-c:a".to_string(),
                "libopus".to_string(),
            ]);
        }
        _ => {
            // mp4 / h264 default
            let crf = instructions.crf.unwrap_or(23).to_string();
            let ab = instructions.audio_bitrate.as_deref().unwrap_or("192k");
            args.extend([
                "-c:v".to_string(),
                "libx264".to_string(),
                "-crf".to_string(),
                crf,
                "-c:a".to_string(),
                "aac".to_string(),
                "-b:a".to_string(),
                ab.to_string(),
            ]);
        }
    }

    args.push(instructions.output_path.clone());
    args.push("-y".to_string());

    // ── Compute total duration for progress % ──────────────────────────────
    let total_duration: f64 = if !instructions.cuts.is_empty() {
        instructions
            .cuts
            .iter()
            .map(|c| c.end_sec - c.start_sec)
            .sum()
    } else {
        get_video_info(app.clone(), instructions.input_path.clone())
            .await
            .map(|i| i.duration)
            .unwrap_or(1.0)
    };

    // ── Spawn ffmpeg with stderr piped ─────────────────────────────────────
    let bin = find_ffmpeg_bin(&app)?;
    let output_path = instructions.output_path.clone();

    let app_clone = app.clone();
    let status = tokio::task::spawn_blocking(move || {
        let mut child = Command::new(bin)
            .args(&args)
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn ffmpeg: {e}"))?;

        let stderr = child.stderr.take().unwrap();
        let reader = BufReader::new(stderr);

        for line in reader.lines().map_while(Result::ok) {
            let _ = app_clone.emit("export_log", line.clone());
            if let Some(secs) = parse_time_secs(&line) {
                let pct = ((secs / total_duration) * 100.0).clamp(0.0, 100.0) as f32;
                let _ = app_clone.emit("export_progress", pct);
            }
        }

        child
            .wait()
            .map_err(|e| format!("ffmpeg wait failed: {e}"))
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))??;

    if !status.success() {
        return Err(format!(
            "export_with_effects failed (exit {})",
            status.code().unwrap_or(-1)
        ));
    }

    let _ = app.emit("export_progress", 100.0f32);
    Ok(output_path)
}
