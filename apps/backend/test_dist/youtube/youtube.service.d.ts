import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { VideoGateway } from '../gateway/video.gateway';
export interface ChannelInfo {
    channelId: string;
    name: string;
    thumbnailUrl: string | null;
    subscriberCount: number;
    videoCount: number;
}
export interface UploadVideoDto {
    videoGenerationId: string;
    title: string;
    description: string;
    tags: string[];
    privacy: 'public' | 'unlisted' | 'private';
    isShort: boolean;
    scheduledAt?: string;
}
export interface UploadResult {
    youtubeVideoId: string;
    youtubeUrl: string;
}
export interface DailyVideoStat {
    date: string;
    views: number;
    watchTime: number;
    likes: number;
    subscribersGained: number;
    ctr: number;
}
export interface VideoAnalytics {
    views: number;
    watchTime: number;
    likes: number;
    subscribersGained: number;
    ctr: number;
    dailyStats: DailyVideoStat[];
}
export interface DailyChannelStat {
    date: string;
    views: number;
    watchTime: number;
    likes: number;
    subscribersGained: number;
}
export interface ChannelAnalytics {
    totalViews: number;
    totalWatchTime: number;
    totalLikes: number;
    totalSubscribersGained: number;
    dailyStats: DailyChannelStat[];
}
export declare class YoutubeService {
    private readonly prisma;
    private readonly httpService;
    private readonly config;
    private readonly videoGateway;
    private readonly clientId;
    private readonly clientSecret;
    private readonly redirectUri;
    private readonly frontendUrl;
    constructor(prisma: PrismaService, httpService: HttpService, config: ConfigService, videoGateway: VideoGateway);
    getAuthUrl(userId: string): string;
    handleCallback(code: string, userId: string): Promise<void>;
    getAccessToken(userId: string): Promise<string>;
    uploadVideo(userId: string, dto: UploadVideoDto): Promise<UploadResult>;
    getChannelInfo(userId: string): Promise<ChannelInfo | null>;
    getVideoAnalytics(userId: string, youtubeVideoId: string): Promise<VideoAnalytics>;
    getChannelAnalytics(userId: string): Promise<ChannelAnalytics>;
    disconnectChannel(userId: string): Promise<void>;
}
//# sourceMappingURL=youtube.service.d.ts.map