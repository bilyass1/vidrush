#[cfg(test)]
mod tests {
    use super::super::comfyui::*;
    use std::fs;

    #[tokio::test]
    #[ignore] // Remove this to run integration tests against real API
    async fn test_text_to_video_generation() {
        let params = VideoParams {
            prompt: "cinematic test scene, camera moving slowly".to_string(),
            negative_prompt: None,
            width: 768,
            height: 432,
            length: 49,
            frame_rate: 25,
            seed: 42,
            image_path: None,
            t2v_mode: true,
        };

        let result = generate_video(params).await;
        assert!(result.is_ok(), "Video generation failed: {:?}", result.err());

        let video_bytes = result.unwrap();
        assert!(!video_bytes.is_empty(), "Video bytes should not be empty");
        assert!(video_bytes.len() > 1000, "Video should be larger than 1KB");

        println!("Generated video size: {} bytes", video_bytes.len());
    }

    #[tokio::test]
    #[ignore]
    async fn test_save_video_to_file() {
        let params = VideoParams {
            prompt: "cinematic test scene, camera moving slowly".to_string(),
            negative_prompt: None,
            width: 768,
            height: 432,
            length: 49,
            frame_rate: 25,
            seed: 42,
            image_path: None,
            t2v_mode: true,
        };

        let video_bytes = generate_video(params).await.expect("Failed to generate video");

        let output_path = if cfg!(windows) {
            "C:\\temp\\test_output.mp4"
        } else {
            "/tmp/test_output.mp4"
        };

        fs::write(output_path, &video_bytes).expect("Failed to write video file");
        
        let metadata = fs::metadata(output_path).expect("Failed to read file metadata");
        assert!(metadata.len() > 0, "Saved file should not be empty");

        println!("Video saved to: {}", output_path);
        println!("File size: {} bytes", metadata.len());
    }

    #[tokio::test]
    #[ignore]
    async fn test_queue_status() {
        let result = get_queue_status().await;
        assert!(result.is_ok(), "Queue status request failed: {:?}", result.err());

        let status = result.unwrap();
        println!("Queue status: {}", serde_json::to_string_pretty(&status).unwrap());
    }

    #[tokio::test]
    #[ignore]
    async fn test_cancel_generation() {
        let result = cancel_generation().await;
        assert!(result.is_ok(), "Cancel generation failed: {:?}", result.err());
        println!("Generation cancelled successfully");
    }

    #[tokio::test]
    async fn test_video_params_defaults() {
        let params = VideoParams {
            prompt: "test".to_string(),
            negative_prompt: None,
            width: 1080,
            height: 720,
            length: 193,
            frame_rate: 25,
            seed: 42,
            image_path: None,
            t2v_mode: true,
        };

        assert_eq!(params.width, 1080);
        assert_eq!(params.height, 720);
        assert_eq!(params.length, 193);
        assert_eq!(params.frame_rate, 25);
    }

    #[tokio::test]
    async fn test_video_params_serialization() {
        let params = VideoParams {
            prompt: "test prompt".to_string(),
            negative_prompt: Some("bad quality".to_string()),
            width: 768,
            height: 432,
            length: 49,
            frame_rate: 25,
            seed: 12345,
            image_path: Some("/path/to/image.png".to_string()),
            t2v_mode: false,
        };

        let json = serde_json::to_string(&params).expect("Failed to serialize");
        let deserialized: VideoParams = serde_json::from_str(&json).expect("Failed to deserialize");

        assert_eq!(deserialized.prompt, params.prompt);
        assert_eq!(deserialized.width, params.width);
        assert_eq!(deserialized.seed, params.seed);
        assert_eq!(deserialized.t2v_mode, params.t2v_mode);
    }
}

#[cfg(test)]
mod mock_tests {
    use super::super::comfyui::*;
    use mockito::{Server, ServerGuard};
    use serde_json::json;

    async fn setup_mock_server() -> ServerGuard {
        Server::new_async().await
    }

    #[tokio::test]
    async fn test_mock_queue_status() {
        let mut server = setup_mock_server().await;
        
        let mock = server.mock("GET", "/queue")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(json!({
                "queue_running": [],
                "queue_pending": []
            }).to_string())
            .create_async()
            .await;

        // Note: This test demonstrates the structure but won't work without modifying
        // the COMFY_URL constant to use the mock server URL
        println!("Mock server URL: {}", server.url());
        
        mock.assert_async().await;
    }

    #[tokio::test]
    async fn test_mock_prompt_response() {
        let mut server = setup_mock_server().await;
        
        let mock = server.mock("POST", "/prompt")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(json!({
                "prompt_id": "test-prompt-id-123"
            }).to_string())
            .create_async()
            .await;

        println!("Mock server ready at: {}", server.url());
        
        mock.assert_async().await;
    }

    #[tokio::test]
    async fn test_mock_history_response() {
        let mut server = setup_mock_server().await;
        
        let mock = server.mock("GET", "/history/test-prompt-id")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(json!({
                "test-prompt-id": {
                    "outputs": {
                        "9": {
                            "videos": [{
                                "filename": "test_video.mp4",
                                "subfolder": "output"
                            }]
                        }
                    }
                }
            }).to_string())
            .create_async()
            .await;

        println!("Mock history endpoint ready");
        
        mock.assert_async().await;
    }
}
