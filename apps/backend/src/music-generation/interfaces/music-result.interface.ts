export interface MusicJob {
  jobId: string;
  musicProjectId: string;
  status: 'PENDING' | 'GENERATING' | 'DONE' | 'FAILED';
  audioUrl?: string;
}

export interface MusicGenerationStatus {
  status: 'PENDING' | 'GENERATING' | 'DONE' | 'FAILED';
  progress: number;
  message: string;
  audioUrl?: string;
}
