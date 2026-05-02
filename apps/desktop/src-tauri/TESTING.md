# ComfyUI Integration Tests

## Running Tests

### Unit Tests (No API Required)
Run the basic unit tests that don't require a live ComfyUI API:

```bash
cd apps/desktop/src-tauri
cargo test -- --nocapture
```

### Integration Tests (Requires Live API)
To run integration tests against the actual ComfyUI API, remove the `#[ignore]` attribute from the tests and run:

```bash
cd apps/desktop/src-tauri
cargo test -- --nocapture --ignored
```

Or run a specific test:

```bash
cargo test test_text_to_video_generation -- --nocapture --ignored
cargo test test_queue_status -- --nocapture --ignored
```

## Test Coverage

### Unit Tests (Always Run)
- ✅ `test_video_params_defaults` - Validates default parameter values
- ✅ `test_video_params_serialization` - Tests JSON serialization/deserialization

### Integration Tests (Requires API)
- 🔌 `test_text_to_video_generation` - Full text-to-video generation
- 🔌 `test_save_video_to_file` - Generates and saves video to disk
- 🔌 `test_queue_status` - Checks ComfyUI queue status
- 🔌 `test_cancel_generation` - Tests cancellation endpoint

### Mock Tests
- 🎭 `test_mock_queue_status` - Mocked queue status response
- 🎭 `test_mock_prompt_response` - Mocked prompt submission
- 🎭 `test_mock_history_response` - Mocked history polling

## Test Parameters

The integration tests use these parameters:
- **Prompt**: "cinematic test scene, camera moving slowly"
- **Dimensions**: 768x432 (smaller for faster testing)
- **Length**: 49 frames (~2 seconds at 25fps)
- **Seed**: 42 (reproducible results)
- **Mode**: Text-to-video

## Output

Integration tests will save the generated video to:
- **Windows**: `C:\temp\test_output.mp4`
- **Linux/Mac**: `/tmp/test_output.mp4`

## Notes

- Integration tests are marked with `#[ignore]` by default to prevent accidental API calls
- The ComfyUI API must be running at the configured URL
- Tests use `--nocapture` to see println! output
- Mock tests demonstrate the structure but require URL injection to work fully
