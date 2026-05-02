export interface ScriptScene {
  scene_number: number;
  narration: string;
  duration_seconds: number;
  positive_prompt: string;
  negative_prompt: string;
}

export interface ScriptResult {
  title: string;
  hook: string;
  scenes: ScriptScene[];
  loop_ending: string;
  total_words: number;
  estimated_duration_seconds: number;
}

export interface VideoJob {
  jobId: string;
  scriptProjectId: string;
  status: string;
}
