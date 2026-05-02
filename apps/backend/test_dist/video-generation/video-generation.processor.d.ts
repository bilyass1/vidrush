import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './services/gemini.service';
import { ElevenLabsService } from './services/elevenlabs.service';
import { VeoService } from './services/veo.service';
import { ShotstackService } from './services/shotstack.service';
import { VideoGateway } from '../gateway/video.gateway';
export interface GenerateYoutubeJobData {
    videoGenerationId: string;
    userId: string;
    topic: string;
    duration: number;
    genre: string;
    aspectRatio: string;
    market: string;
}
export declare class VideoGenerationProcessor {
    private readonly prisma;
    private readonly geminiService;
    private readonly elevenLabsService;
    private readonly veoService;
    private readonly shotstackService;
    private readonly videoGateway;
    private readonly logger;
    constructor(prisma: PrismaService, geminiService: GeminiService, elevenLabsService: ElevenLabsService, veoService: VeoService, shotstackService: ShotstackService, videoGateway: VideoGateway);
    processYoutube(job: Job<GenerateYoutubeJobData>): Promise<void>;
    private updateStatus;
}
//# sourceMappingURL=video-generation.processor.d.ts.map