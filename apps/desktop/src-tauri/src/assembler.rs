use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};

use crate::ffmpeg::find_ffmpeg_bin;

// ── Data structs ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SceneInstruction {
    pub footage_path: String,
    pub start_sec: f64,
    pub duration_sec: f64,
    pub sfx_path: Option<String>,
    pub sfx_volume: f32,
    pub transition: String,
    pub caption: Option<String>,  // narration text for subtitle burn
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssemblyInstructions {
    pub scenes: Vec<SceneInstruction>,
    pub voice_path: String,
    pub music_paths: Vec<String>,
    pub output_path: String,
    pub total_duration: f64,
    pub style: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssemblyResult {
    pub output_path: String,
    pub duration: f64,
    pub success: bool,
    pub error: Option<String>,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn get_temp_dir(job_id: &str) -> PathBuf {
    // Use OS temp dir — works on Windows, macOS, Linux
    std::env::temp_dir().join("vidrush").join(job_id).join("prepared")
}

/// Escape text for FFmpeg drawtext filter
fn escape_drawtext(s: &str) -> String {
    s.replace('\\', "\\\\")
     .replace(':', "\\:")
     .replace('\'', "\\'")
     .replace('[', "\\[")
     .replace(']', "\\]")
     // Truncate long lines to avoid overflow
     .chars()
     .take(80)
     .collect()
}

/// Run an ffmpeg command on a blocking thread, parse stderr for progress.
async fn run_ffmpeg(args: Vec<String>, app: AppHandle, total_dur: f64) -> Result<(), String> {
    let bin = find_ffmpeg_bin(&app)?;

    tokio::task::spawn_blocking(move || {
        let mut child = Command::new(bin)
            .args(&args)
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn ffmpeg: {e}"))?;

        let stderr = child.stderr.take().unwrap();
        let reader = BufReader::new(stderr);
        let mut last_stderr = String::new();
        let mut all_stderr = String::new();

        for line in reader.lines().map_while(Result::ok) {
            all_stderr.push_str(&line);
            all_stderr.push('\n');
            last_stderr = line.clone();
            if let Some(secs) = parse_time_secs(&line) {
                let pct = ((secs / total_dur.max(1.0)) * 100.0).clamp(0.0, 100.0) as u32;
                let _ = app.emit("assembly_progress", pct);
            }
        }

        let status = child.wait().map_err(|e| format!("ffmpeg wait failed: {e}"))?;
        if !status.success() {
            let err_line = all_stderr
                .lines()
                .filter(|l| l.contains("Error") || l.contains("Invalid") || l.contains("No such"))
                .last()
                .unwrap_or(&last_stderr)
                .to_string();
            return Err(format!("ffmpeg failed: {err_line}"));
        }
        Ok(())
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

fn parse_time_secs(line: &str) -> Option<f64> {
    let pos = line.find("time=")?;
    let rest = &line[pos + 5..];
    let end = rest.find(' ').unwrap_or(rest.len());
    let parts: Vec<&str> = rest[..end].split(':').collect();
    if parts.len() == 3 {
        let h: f64 = parts[0].parse().ok()?;
        let m: f64 = parts[1].parse().ok()?;
        let s: f64 = parts[2].parse().ok()?;
        Some(h * 3600.0 + m * 60.0 + s)
    } else {
        None
    }
}

// ── Main assembly function ────────────────────────────────────────────────────

pub async fn assemble_video(
    instructions: AssemblyInstructions,
    app: AppHandle,
) -> Result<AssemblyResult, String> {
    // Use a unique job id derived from output path hash
    let job_id = format!("{:x}", md5_short(&instructions.output_path));
    let temp_dir = get_temp_dir(&job_id);
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Cannot create temp dir: {e}"))?;

    let total = instructions.total_duration;
    let scenes = &instructions.scenes;

    // ── PHASE A — Prepare each clip ──────────────────────────────────────────
    let mut prepared_paths: Vec<String> = Vec::new();

    for (i, scene) in scenes.iter().enumerate() {
        let out = temp_dir.join(format!("prepared_{i}.mp4"));
        let out_str = out.to_string_lossy().to_string();

        let color_filter = match instructions.style.as_str() {
            "Documentary"  => "eq=contrast=1.1:brightness=0.02:saturation=0.9",
            "Dark History" => "eq=contrast=1.3:brightness=-0.05:saturation=0.6,colorchannelmixer=rr=1.1:gg=0.9:bb=0.85",
            "True Crime"   => "eq=contrast=1.2:brightness=-0.03:saturation=0.7",
            "Educational"  => "eq=contrast=1.05:brightness=0.03:saturation=1.1",
            _              => "eq=contrast=1.0",
        };

        let scale_filter = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black";

        // Build subtitle drawtext filter if caption present
        let caption_filter = if let Some(ref text) = scene.caption {
            let escaped = escape_drawtext(text);
            // White text with black outline, bottom-center, 80% width box
            format!(
                ",drawtext=text='{escaped}'\
                :fontsize=36\
                :fontcolor=white\
                :borderw=2\
                :bordercolor=black\
                :x=(w-text_w)/2\
                :y=h-th-60\
                :box=1\
                :boxcolor=black@0.45\
                :boxborderw=8\
                :line_spacing=4\
                :expansion=none"
            )
        } else {
            String::new()
        };

        let vf = format!("{scale_filter},{color_filter}{caption_filter}");

        let args = vec![
            "-y".to_string(),
            "-ss".to_string(), scene.start_sec.to_string(),
            "-t".to_string(),  scene.duration_sec.to_string(),
            "-i".to_string(),  scene.footage_path.clone(),
            "-vf".to_string(), vf,
            "-c:v".to_string(), "libx264".to_string(),
            "-preset".to_string(), "fast".to_string(),
            "-crf".to_string(), "22".to_string(),
            "-r".to_string(), "30".to_string(),
            "-an".to_string(),
            out_str.clone(),
        ];

        run_ffmpeg(args, app.clone(), scene.duration_sec).await?;

        let pct = (i as f32 / scenes.len() as f32 * 30.0) as u32;
        let _ = app.emit("assembly_progress", pct);
        prepared_paths.push(out_str);
    }

    // ── PHASE B — Concatenate clips ──────────────────────────────────────────
    let video_output: String;

    if prepared_paths.len() == 1 {
        video_output = prepared_paths[0].clone();
    } else {
        let all_cut = scenes.iter().all(|s| s.transition == "cut");

        if all_cut {
            let concat_txt = temp_dir.join("concat.txt");
            let lines: String = prepared_paths
                .iter()
                .map(|p| format!("file '{}'\n", p))
                .collect();
            std::fs::write(&concat_txt, lines)
                .map_err(|e| format!("Cannot write concat.txt: {e}"))?;

            let out = temp_dir.join("video_only.mp4");
            let out_str = out.to_string_lossy().to_string();

            run_ffmpeg(vec![
                "-y".to_string(),
                "-f".to_string(), "concat".to_string(),
                "-safe".to_string(), "0".to_string(),
                "-i".to_string(), concat_txt.to_string_lossy().to_string(),
                "-c".to_string(), "copy".to_string(),
                out_str.clone(),
            ], app.clone(), total).await?;

            video_output = out_str;
        } else {
            // xfade transitions
            let mut inputs: Vec<String> = Vec::new();
            for p in &prepared_paths {
                inputs.push("-i".to_string());
                inputs.push(p.clone());
            }

            let mut filter = String::new();
            let mut offset = 0.0_f64;
            let mut prev_label = "[0:v]".to_string();

            for i in 1..scenes.len() {
                offset += scenes[i - 1].duration_sec - 1.0;
                let new_label = format!("[v{i}]");
                filter.push_str(&format!(
                    "{prev_label}[{i}:v]xfade=transition=fade:duration=1:offset={offset:.3}{new_label};"
                ));
                prev_label = new_label;
            }
            // Remove trailing semicolon
            filter = filter.trim_end_matches(';').to_string();

            let out = temp_dir.join("video_with_transitions.mp4");
            let out_str = out.to_string_lossy().to_string();

            let mut args = inputs;
            args.extend([
                "-y".to_string(),
                "-filter_complex".to_string(), filter,
                "-map".to_string(), prev_label,
                "-c:v".to_string(), "libx264".to_string(),
                "-preset".to_string(), "medium".to_string(),
                "-crf".to_string(), "20".to_string(),
                out_str.clone(),
            ]);

            run_ffmpeg(args, app.clone(), total).await?;
            video_output = out_str;
        }
    }

    let _ = app.emit("assembly_progress", 60u32);

    // ── PHASE C — Mix audio ───────────────────────────────────────────────────
    let audio_out = temp_dir.join("audio_mixed.m4a");
    let audio_out_str = audio_out.to_string_lossy().to_string();

    let has_music = !instructions.music_paths.is_empty();
    let sfx_paths: Vec<(usize, &str)> = scenes
        .iter()
        .enumerate()
        .filter_map(|(i, s)| s.sfx_path.as_deref().map(|p| (i, p)))
        .collect();

    if !has_music && sfx_paths.is_empty() {
        // Voice only
        run_ffmpeg(vec![
            "-y".to_string(),
            "-i".to_string(), instructions.voice_path.clone(),
            "-c:a".to_string(), "aac".to_string(),
            "-b:a".to_string(), "192k".to_string(),
            "-t".to_string(), total.to_string(),
            audio_out_str.clone(),
        ], app.clone(), total).await?;
    } else {
        let mut audio_inputs: Vec<String> = vec![
            "-i".to_string(), instructions.voice_path.clone(),
        ];

        if has_music {
            audio_inputs.push("-i".to_string());
            audio_inputs.push(instructions.music_paths[0].clone());
        }

        for (_, sfx) in &sfx_paths {
            audio_inputs.push("-i".to_string());
            audio_inputs.push(sfx.to_string());
        }

        // Build amix filter
        let mut filter_parts: Vec<String> = Vec::new();
        let mix_inputs = String::from("[0:a]volume=1.0[voice]");
        filter_parts.push(mix_inputs.clone());

        let mut amix_labels = vec!["[voice]".to_string()];
        let mut input_idx = 1usize;

        if has_music {
            let fade_out_start = (total - 5.0).max(0.0);
            filter_parts.push(format!(
                "[{input_idx}:a]volume=0.12,afade=t=in:d=2,afade=t=out:d=5:st={fade_out_start:.1}[music]"
            ));
            amix_labels.push("[music]".to_string());
            input_idx += 1;
        }

        for (j, _) in &sfx_paths {
            filter_parts.push(format!("[{input_idx}:a]volume=0.25[sfx{j}]"));
            amix_labels.push(format!("[sfx{j}]"));
            input_idx += 1;
        }

        let n = amix_labels.len();
        let amix = format!("{}amix=inputs={n}:duration=first:dropout_transition=2[aout]", amix_labels.join(""));
        filter_parts.push(amix);

        let mut args = audio_inputs;
        args.extend([
            "-y".to_string(),
            "-filter_complex".to_string(), filter_parts.join(";"),
            "-map".to_string(), "[aout]".to_string(),
            "-c:a".to_string(), "aac".to_string(),
            "-b:a".to_string(), "192k".to_string(),
            "-t".to_string(), total.to_string(),
            audio_out_str.clone(),
        ]);

        run_ffmpeg(args, app.clone(), total).await?;
    }

    let _ = app.emit("assembly_progress", 80u32);

    // ── PHASE D — Final merge ─────────────────────────────────────────────────
    run_ffmpeg(vec![
        "-y".to_string(),
        "-i".to_string(), video_output,
        "-i".to_string(), audio_out_str,
        "-c:v".to_string(), "copy".to_string(),
        "-c:a".to_string(), "aac".to_string(),
        "-b:a".to_string(), "192k".to_string(),
        "-shortest".to_string(),
        "-movflags".to_string(), "+faststart".to_string(),
        instructions.output_path.clone(),
    ], app.clone(), total).await?;

    let _ = app.emit("assembly_progress", 100u32);

    Ok(AssemblyResult {
        output_path: instructions.output_path.clone(),
        duration: total,
        success: true,
        error: None,
    })
}

/// Tiny deterministic hash for job id generation (no external dep needed).
fn md5_short(s: &str) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in s.bytes() {
        h ^= b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}
