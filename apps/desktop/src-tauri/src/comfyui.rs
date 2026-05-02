use reqwest::{Client, multipart};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::Path;
use std::time::Duration;
use tauri::Emitter;
use tokio::time::sleep;
use uuid::Uuid;

const COMFY_URL: &str = "https://vault-folk-delivery-illustration.trycloudflare.com";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoParams {
    pub prompt: String,
    pub negative_prompt: Option<String>,
    #[serde(default = "default_width")]
    pub width: u32,
    #[serde(default = "default_height")]
    pub height: u32,
    #[serde(default = "default_length")]
    pub length: u32,
    #[serde(default = "default_frame_rate")]
    pub frame_rate: u32,
    pub seed: i64,
    pub image_path: Option<String>,
    #[serde(default)]
    pub t2v_mode: bool,
}

fn default_width() -> u32 { 1080 }
fn default_height() -> u32 { 720 }
fn default_length() -> u32 { 193 }
fn default_frame_rate() -> u32 { 25 }

#[derive(Debug, Deserialize)]
struct QueueResponse {
    prompt_id: String,
}

#[derive(Debug, Deserialize)]
struct HistoryResponse {
    #[serde(flatten)]
    prompts: std::collections::HashMap<String, PromptHistory>,
}

#[derive(Debug, Deserialize)]
struct PromptHistory {
    outputs: std::collections::HashMap<String, OutputNode>,
}

#[derive(Debug, Deserialize)]
struct OutputNode {
    videos: Option<Vec<VideoOutput>>,
}

#[derive(Debug, Deserialize)]
struct VideoOutput {
    filename: String,
    subfolder: String,
}

pub async fn generate_video(params: VideoParams) -> Result<Vec<u8>, String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Upload image if provided
    let image_filename = if let Some(ref image_path) = params.image_path {
        let filename = upload_image(&client, image_path).await?;
        Some(filename)
    } else {
        None
    };

    // Build workflow
    let workflow = build_workflow(&params, image_filename.as_deref());

    // Queue prompt
    let prompt_id = queue_prompt(&client, workflow).await?;

    // Wait for completion
    let (filename, subfolder) = wait_for_completion(&client, &prompt_id).await?;

    // Download video
    download_video(&client, &filename, &subfolder).await
}

pub async fn generate_video_with_progress(
    params: VideoParams,
    app_handle: tauri::AppHandle,
) -> Result<Vec<u8>, String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|e| {
            let msg = format!("Failed to create HTTP client: {}", e);
            let _ = app_handle.emit("video-progress", json!({
                "status": "error",
                "message": msg.clone()
            }));
            msg
        })?;

    // Upload image if provided
    let image_filename = if let Some(ref image_path) = params.image_path {
        let filename = upload_image(&client, image_path).await.map_err(|e| {
            let _ = app_handle.emit("video-progress", json!({
                "status": "error",
                "message": e.clone()
            }));
            e
        })?;
        Some(filename)
    } else {
        None
    };

    // Build workflow
    let workflow = build_workflow(&params, image_filename.as_deref());

    // Queue prompt
    let prompt_id = queue_prompt(&client, workflow).await.map_err(|e| {
        let _ = app_handle.emit("video-progress", json!({
            "status": "error",
            "message": e.clone()
        }));
        e
    })?;

    // Wait for completion with progress
    let (filename, subfolder) = wait_for_completion_with_progress(&client, &prompt_id, &app_handle).await?;

    // Emit done event
    let _ = app_handle.emit("video-progress", json!({
        "status": "done",
        "filename": filename.clone()
    }));

    // Download video
    download_video(&client, &filename, &subfolder).await.map_err(|e| {
        let _ = app_handle.emit("video-progress", json!({
            "status": "error",
            "message": e.clone()
        }));
        e
    })
}

async fn upload_image(client: &Client, image_path: &str) -> Result<String, String> {
    let path = Path::new(image_path);
    let filename = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid image path".to_string())?;

    let image_data = tokio::fs::read(image_path)
        .await
        .map_err(|e| format!("Failed to read image: {}", e))?;

    let part = multipart::Part::bytes(image_data)
        .file_name(filename.to_string())
        .mime_str("image/png")
        .map_err(|e| format!("Failed to create multipart: {}", e))?;

    let form = multipart::Form::new().part("image", part);

    let response = client
        .post(format!("{}/upload/image", COMFY_URL))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Failed to upload image: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Upload failed with status: {}", response.status()));
    }

    Ok(filename.to_string())
}

async fn queue_prompt(client: &Client, workflow: Value) -> Result<String, String> {
    let payload = json!({
        "prompt": workflow,
        "client_id": Uuid::new_v4().to_string()
    });

    let max_retries = 3;
    let mut last_error = String::new();

    for attempt in 1..=max_retries {
        match client
            .post(format!("{}/prompt", COMFY_URL))
            .json(&payload)
            .send()
            .await
        {
            Ok(response) => {
                if !response.status().is_success() {
                    return Err(format!("Queue failed with status: {}", response.status()));
                }

                let queue_response: QueueResponse = response
                    .json()
                    .await
                    .map_err(|e| format!("Failed to parse queue response: {}", e))?;

                return Ok(queue_response.prompt_id);
            }
            Err(e) => {
                last_error = format!("Failed to queue prompt: {}", e);
                if attempt < max_retries {
                    sleep(Duration::from_secs(5)).await;
                }
            }
        }
    }

    Err(format!("{} (after {} retries)", last_error, max_retries))
}

pub async fn wait_for_completion(
    client: &Client,
    prompt_id: &str,
) -> Result<(String, String), String> {
    let max_attempts = 300;
    let mut attempt = 0;

    loop {
        sleep(Duration::from_secs(3)).await;
        attempt += 1;

        if attempt >= max_attempts {
            return Err("Video generation timeout after 15 minutes".to_string());
        }

        let response = client
            .get(format!("{}/history/{}", COMFY_URL, prompt_id))
            .send()
            .await
            .map_err(|e| format!("Failed to check history: {}", e))?;

        if !response.status().is_success() {
            continue;
        }

        let history: HistoryResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse history: {}", e))?;

        if let Some(prompt_history) = history.prompts.get(prompt_id) {
            for output_node in prompt_history.outputs.values() {
                if let Some(videos) = &output_node.videos {
                    if let Some(video) = videos.first() {
                        return Ok((video.filename.clone(), video.subfolder.clone()));
                    }
                }
            }
        }
    }
}

async fn wait_for_completion_with_progress(
    client: &Client,
    prompt_id: &str,
    app_handle: &tauri::AppHandle,
) -> Result<(String, String), String> {
    let max_attempts = 300;
    let mut attempt = 0;

    loop {
        sleep(Duration::from_secs(3)).await;
        attempt += 1;

        // Emit progress event
        let _ = app_handle.emit("video-progress", json!({
            "status": "generating",
            "attempt": attempt,
            "max": max_attempts
        }));

        if attempt >= max_attempts {
            let msg = "Video generation timeout after 15 minutes".to_string();
            let _ = app_handle.emit("video-progress", json!({
                "status": "error",
                "message": msg.clone()
            }));
            return Err(msg);
        }

        let response = client
            .get(format!("{}/history/{}", COMFY_URL, prompt_id))
            .send()
            .await
            .map_err(|e| format!("Failed to check history: {}", e))?;

        if !response.status().is_success() {
            continue;
        }

        let history: HistoryResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse history: {}", e))?;

        if let Some(prompt_history) = history.prompts.get(prompt_id) {
            for output_node in prompt_history.outputs.values() {
                if let Some(videos) = &output_node.videos {
                    if let Some(video) = videos.first() {
                        return Ok((video.filename.clone(), video.subfolder.clone()));
                    }
                }
            }
        }
    }
}

pub async fn download_video(
    client: &Client,
    filename: &str,
    subfolder: &str,
) -> Result<Vec<u8>, String> {
    let url = format!(
        "{}/view?filename={}&subfolder={}&type=output",
        COMFY_URL, filename, subfolder
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to download video: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }

    response
        .bytes()
        .await
        .map(|b| b.to_vec())
        .map_err(|e| format!("Failed to read video bytes: {}", e))
}

fn build_workflow(params: &VideoParams, image_filename: Option<&str>) -> Value {
    let negative = params.negative_prompt.clone().unwrap_or_else(|| 
        "pc game, console game, video game, cartoon, childish, ugly".to_string()
    );
    
    let image_name = image_filename.unwrap_or("example.png");

    json!({
        // Models
        "267:236": {
            "inputs": { "ckpt_name": "ltx-2.3-22b-dev-fp8.safetensors" },
            "class_type": "CheckpointLoaderSimple"
        },
        "267:243": {
            "inputs": {
                "text_encoder": "gemma_3_12B_it_fp4_mixed.safetensors",
                "ckpt_name": "ltx-2.3-22b-dev-fp8.safetensors",
                "device": "default"
            },
            "class_type": "LTXAVTextEncoderLoader"
        },
        "267:221": {
            "inputs": { "ckpt_name": "ltx-2.3-22b-dev-fp8.safetensors" },
            "class_type": "LTXVAudioVAELoader"
        },
        "267:232": {
            "inputs": {
                "lora_name": "ltx-2.3-22b-distilled-lora-384.safetensors",
                "strength_model": 0.5,
                "model": ["267:236", 0]
            },
            "class_type": "LoraLoaderModelOnly"
        },
        "267:233": {
            "inputs": { "model_name": "ltx-2.3-spatial-upscaler-x2-1.1.safetensors" },
            "class_type": "LatentUpscaleModelLoader"
        },
        
        // Parameters
        "267:257": {
            "inputs": { "value": params.width },
            "class_type": "PrimitiveInt"
        },
        "267:258": {
            "inputs": { "value": params.height },
            "class_type": "PrimitiveInt"
        },
        "267:225": {
            "inputs": { "value": params.length },
            "class_type": "PrimitiveInt"
        },
        "267:260": {
            "inputs": { "value": params.frame_rate },
            "class_type": "PrimitiveInt"
        },
        "267:201": {
            "inputs": { "value": params.t2v_mode },
            "class_type": "PrimitiveBoolean"
        },
        
        // Seeds
        "267:216": {
            "inputs": { "noise_seed": 42 },
            "class_type": "RandomNoise"
        },
        "267:237": {
            "inputs": { "noise_seed": params.seed },
            "class_type": "RandomNoise"
        },
        
        // Prompts
        "267:266": {
            "inputs": { "value": params.prompt.clone() },
            "class_type": "PrimitiveStringMultiline"
        },
        "267:247": {
            "inputs": {
                "text": negative,
                "clip": ["267:243", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "267:240": {
            "inputs": {
                "text": ["267:266", 0],
                "clip": ["267:243", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        
        // Image source
        "269": {
            "inputs": { "image": image_name },
            "class_type": "LoadImage"
        },
        
        // Math nodes
        "267:256": {
            "inputs": { "expression": "a/2", "values.a": ["267:257", 0] },
            "class_type": "ComfyMathExpression"
        },
        "267:259": {
            "inputs": { "expression": "a/2", "values.a": ["267:258", 0] },
            "class_type": "ComfyMathExpression"
        },
        "267:261": {
            "inputs": { "expression": "a", "values.a": ["267:260", 0] },
            "class_type": "ComfyMathExpression"
        },
        
        // Pipeline
        "267:238": {
            "inputs": {
                "resize_type": "scale dimensions",
                "resize_type.width": ["267:257", 0],
                "resize_type.height": ["267:258", 0],
                "resize_type.crop": "center",
                "scale_method": "lanczos",
                "input": ["269", 0]
            },
            "class_type": "ResizeImageMaskNode"
        },
        "267:235": {
            "inputs": {
                "longer_edge": 1536,
                "images": ["267:238", 0]
            },
            "class_type": "ResizeImagesByLongerEdge"
        },
        "267:248": {
            "inputs": {
                "img_compression": 18,
                "image": ["267:235", 0]
            },
            "class_type": "LTXVPreprocess"
        },
        "267:228": {
            "inputs": {
                "width": ["267:256", 1],
                "height": ["267:259", 1],
                "length": ["267:225", 0],
                "batch_size": 1
            },
            "class_type": "EmptyLTXVLatentVideo"
        },
        "267:249": {
            "inputs": {
                "strength": 0.7,
                "bypass": ["267:201", 0],
                "vae": ["267:236", 2],
                "image": ["267:248", 0],
                "latent": ["267:228", 0]
            },
            "class_type": "LTXVImgToVideoInplace"
        },
        "267:214": {
            "inputs": {
                "frames_number": ["267:225", 0],
                "frame_rate": ["267:261", 1],
                "batch_size": 1,
                "audio_vae": ["267:221", 0]
            },
            "class_type": "LTXVEmptyLatentAudio"
        },
        "267:222": {
            "inputs": {
                "video_latent": ["267:249", 0],
                "audio_latent": ["267:214", 0]
            },
            "class_type": "LTXVConcatAVLatent"
        },
        "267:239": {
            "inputs": {
                "frame_rate": ["267:261", 0],
                "positive": ["267:240", 0],
                "negative": ["267:247", 0]
            },
            "class_type": "LTXVConditioning"
        },
        "267:212": {
            "inputs": {
                "positive": ["267:239", 0],
                "negative": ["267:239", 1],
                "latent": ["267:217", 0]
            },
            "class_type": "LTXVCropGuides"
        },
        "267:231": {
            "inputs": {
                "cfg": 1,
                "model": ["267:232", 0],
                "positive": ["267:239", 0],
                "negative": ["267:239", 1]
            },
            "class_type": "CFGGuider"
        },
        "267:213": {
            "inputs": {
                "cfg": 1,
                "model": ["267:232", 0],
                "positive": ["267:212", 0],
                "negative": ["267:212", 1]
            },
            "class_type": "CFGGuider"
        },
        "267:209": {
            "inputs": { "sampler_name": "euler_ancestral_cfg_pp" },
            "class_type": "KSamplerSelect"
        },
        "267:246": {
            "inputs": { "sampler_name": "euler_cfg_pp" },
            "class_type": "KSamplerSelect"
        },
        "267:252": {
            "inputs": { "sigmas": "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0" },
            "class_type": "ManualSigmas"
        },
        "267:211": {
            "inputs": { "sigmas": "0.85, 0.7250, 0.4219, 0.0" },
            "class_type": "ManualSigmas"
        },
        "267:215": {
            "inputs": {
                "noise": ["267:237", 0],
                "guider": ["267:231", 0],
                "sampler": ["267:209", 0],
                "sigmas": ["267:252", 0],
                "latent_image": ["267:222", 0]
            },
            "class_type": "SamplerCustomAdvanced"
        },
        "267:217": {
            "inputs": { "av_latent": ["267:215", 0] },
            "class_type": "LTXVSeparateAVLatent"
        },
        "267:253": {
            "inputs": {
                "samples": ["267:217", 0],
                "upscale_model": ["267:233", 0],
                "vae": ["267:236", 2]
            },
            "class_type": "LTXVLatentUpsampler"
        },
        "267:230": {
            "inputs": {
                "strength": 1,
                "bypass": ["267:201", 0],
                "vae": ["267:236", 2],
                "image": ["267:248", 0],
                "latent": ["267:253", 0]
            },
            "class_type": "LTXVImgToVideoInplace"
        },
        "267:229": {
            "inputs": {
                "video_latent": ["267:230", 0],
                "audio_latent": ["267:217", 1]
            },
            "class_type": "LTXVConcatAVLatent"
        },
        "267:219": {
            "inputs": {
                "noise": ["267:216", 0],
                "guider": ["267:213", 0],
                "sampler": ["267:246", 0],
                "sigmas": ["267:211", 0],
                "latent_image": ["267:229", 0]
            },
            "class_type": "SamplerCustomAdvanced"
        },
        "267:218": {
            "inputs": { "av_latent": ["267:219", 0] },
            "class_type": "LTXVSeparateAVLatent"
        },
        "267:220": {
            "inputs": {
                "samples": ["267:218", 1],
                "audio_vae": ["267:221", 0]
            },
            "class_type": "LTXVAudioVAEDecode"
        },
        "267:251": {
            "inputs": {
                "tile_size": 768,
                "overlap": 64,
                "temporal_size": 4096,
                "temporal_overlap": 4,
                "samples": ["267:218", 0],
                "vae": ["267:236", 2]
            },
            "class_type": "VAEDecodeTiled"
        },
        "267:242": {
            "inputs": {
                "fps": ["267:261", 0],
                "images": ["267:251", 0],
                "audio": ["267:220", 0]
            },
            "class_type": "CreateVideo"
        },
        "75": {
            "inputs": {
                "filename_prefix": "video/LTX_2.3_t2v",
                "format": "auto",
                "codec": "auto",
                "video-preview": "",
                "video": ["267:242", 0]
            },
            "class_type": "SaveVideo"
        }
    })
}

pub async fn cancel_generation() -> Result<(), String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .post(format!("{}/queue", COMFY_URL))
        .json(&json!({ "clear": true }))
        .send()
        .await
        .map_err(|e| format!("Failed to cancel generation: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Cancel failed with status: {}", response.status()));
    }

    Ok(())
}

pub async fn get_queue_status() -> Result<Value, String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(format!("{}/queue", COMFY_URL))
        .send()
        .await
        .map_err(|e| format!("Failed to get queue status: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Queue status request failed with status: {}", response.status()));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Failed to parse queue status: {}", e))
}
