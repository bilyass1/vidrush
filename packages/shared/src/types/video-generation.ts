import { VideoType, VideoStatus } from "./enums";

export interface VideoGeneration {
  id: string;
  userId: string;
  type: VideoType;
  status: VideoStatus;
  inputPrompt: string;
  outputUrl: string | null;
  durationMin: number | null;
  costUsd: number | null;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  pipeline: 'free' | 'premium';
  createdAt: Date;
}
