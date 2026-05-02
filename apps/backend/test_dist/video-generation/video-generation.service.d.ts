import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bull';
import { VideoGeneration } from '@prisma/client';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { GeminiService, ScriptPreviewResult } from './services/gemini.service';
export declare class VideoGenerationService {
    private prisma;
    private videoQueue;
    private geminiService;
    constructor(prisma: PrismaService, videoQueue: Queue, geminiService: GeminiService);
    generateScriptPreview(dto: GenerateVideoDto): Promise<ScriptPreviewResult>;
    startGeneration(userId: string, dto: GenerateVideoDto): Promise<{
        jobId: string;
    }>;
    getStatus(jobId: string, userId: string): Promise<{
        status: import(".prisma/client").$Enums.VideoStatus;
        progress: number;
        outputUrl: string | null;
        error: null;
    }>;
    getUserVideos(userId: string): Promise<VideoGeneration[]>;
    getRecent(userId: string, limit: number): Promise<VideoGeneration[]>;
    deleteVideo(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=video-generation.service.d.ts.map