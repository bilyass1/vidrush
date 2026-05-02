import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { YoutubeService } from './youtube.service';
declare class UploadVideoDto {
    videoGenerationId: string;
    title: string;
    description: string;
    tags: string[];
    privacy: 'public' | 'unlisted' | 'private';
    isShort: boolean;
    scheduledAt?: string;
}
export declare class YoutubeController {
    private readonly youtubeService;
    private readonly config;
    constructor(youtubeService: YoutubeService, config: ConfigService);
    getAuthUrl(req: Request): {
        url: string;
    };
    handleCallback(code: string, state: string, res: Response): Promise<void>;
    getChannel(req: Request): Promise<import("./youtube.service").ChannelInfo | null>;
    uploadVideo(req: Request, dto: UploadVideoDto): Promise<import("./youtube.service").UploadResult>;
    getChannelAnalytics(req: Request): Promise<import("./youtube.service").ChannelAnalytics>;
    getVideoAnalytics(req: Request, youtubeVideoId: string): Promise<import("./youtube.service").VideoAnalytics>;
    disconnect(req: Request): Promise<{
        success: boolean;
    }>;
}
export {};
//# sourceMappingURL=youtube.controller.d.ts.map