"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const video_gateway_1 = require("../gateway/video.gateway");
const rxjs_1 = require("rxjs");
const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB
let YoutubeService = class YoutubeService {
    constructor(prisma, httpService, config, videoGateway) {
        this.prisma = prisma;
        this.httpService = httpService;
        this.config = config;
        this.videoGateway = videoGateway;
        this.clientId = this.config.get('GOOGLE_CLIENT_ID', '');
        this.clientSecret = this.config.get('GOOGLE_CLIENT_SECRET', '');
        const backendUrl = this.config.get('BACKEND_URL', 'http://localhost:3001');
        this.redirectUri = `${backendUrl}/api/youtube/callback`;
        this.frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    }
    getAuthUrl(userId) {
        const state = Buffer.from(userId).toString('base64');
        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
        ].join(' ');
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: scopes,
            access_type: 'offline',
            prompt: 'consent',
            state,
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    async handleCallback(code, userId) {
        const tokenRes = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
        }));
        const tokens = tokenRes.data;
        const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
        const channelRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://www.googleapis.com/youtube/v3/channels', {
            params: { part: 'snippet', mine: true },
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        }));
        const channel = channelRes.data.items?.[0];
        if (!channel)
            throw new common_1.NotFoundException('No YouTube channel found for this account');
        await this.prisma.youtubeChannel.upsert({
            where: { userId },
            create: {
                userId,
                channelId: channel.id,
                name: channel.snippet.title,
                thumbnailUrl: channel.snippet.thumbnails?.default?.url ?? null,
                refreshToken: tokens.refresh_token,
                accessToken: tokens.access_token,
                tokenExpiry,
            },
            update: {
                channelId: channel.id,
                name: channel.snippet.title,
                thumbnailUrl: channel.snippet.thumbnails?.default?.url ?? null,
                refreshToken: tokens.refresh_token,
                accessToken: tokens.access_token,
                tokenExpiry,
            },
        });
    }
    async getAccessToken(userId) {
        const channel = await this.prisma.youtubeChannel.findUnique({ where: { userId } });
        if (!channel)
            throw new common_1.UnauthorizedException('YouTube channel not connected');
        if (channel.tokenExpiry.getTime() > Date.now() + 60_000) {
            return channel.accessToken;
        }
        const res = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://oauth2.googleapis.com/token', {
            refresh_token: channel.refreshToken,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
        }));
        const newExpiry = new Date(Date.now() + res.data.expires_in * 1000);
        await this.prisma.youtubeChannel.update({
            where: { userId },
            data: { accessToken: res.data.access_token, tokenExpiry: newExpiry },
        });
        return res.data.access_token;
    }
    async uploadVideo(userId, dto) {
        const accessToken = await this.getAccessToken(userId);
        const videoGen = await this.prisma.videoGeneration.findFirst({
            where: { id: dto.videoGenerationId, userId },
        });
        if (!videoGen?.outputUrl)
            throw new common_1.NotFoundException('Video not found or not ready');
        const videoResponse = await fetch(videoGen.outputUrl);
        if (!videoResponse.ok)
            throw new Error('Failed to fetch video file from storage');
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const fileSize = videoBuffer.length;
        // Initiate resumable upload
        const initiateRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': 'video/mp4',
                'X-Upload-Content-Length': String(fileSize),
            },
            body: JSON.stringify({
                snippet: {
                    title: dto.title,
                    description: dto.description,
                    tags: dto.tags,
                    categoryId: '22',
                },
                status: {
                    privacyStatus: dto.privacy,
                    ...(dto.scheduledAt ? { publishAt: dto.scheduledAt } : {}),
                },
            }),
        });
        if (!initiateRes.ok) {
            const errText = await initiateRes.text();
            throw new Error(`Failed to initiate YouTube upload: ${errText}`);
        }
        const uploadUrl = initiateRes.headers.get('Location');
        if (!uploadUrl)
            throw new Error('No upload URL received from YouTube');
        // Upload in chunks
        let start = 0;
        let youtubeVideoId = '';
        this.videoGateway.emitUploadProgress(userId, { progress: 0 });
        while (start < fileSize) {
            const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
            const chunk = videoBuffer.slice(start, end + 1);
            const progress = Math.round(((end + 1) / fileSize) * 100);
            const chunkRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Content-Type': 'video/mp4',
                },
                body: chunk,
            });
            if (chunkRes.status === 308) {
                // Resume Incomplete — continue
                this.videoGateway.emitUploadProgress(userId, { progress });
                start = end + 1;
                continue;
            }
            if (chunkRes.status === 200 || chunkRes.status === 201) {
                const result = (await chunkRes.json());
                youtubeVideoId = result.id;
                break;
            }
            const errText = await chunkRes.text();
            throw new Error(`Upload chunk failed (HTTP ${chunkRes.status}): ${errText}`);
        }
        if (!youtubeVideoId)
            throw new Error('Upload completed but no video ID returned');
        const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
        await this.prisma.videoGeneration.update({
            where: { id: dto.videoGenerationId },
            data: { youtubeVideoId, youtubeUrl },
        });
        this.videoGateway.emitUploadProgress(userId, { progress: 100, youtubeVideoId });
        return { youtubeVideoId, youtubeUrl };
    }
    async getChannelInfo(userId) {
        const channel = await this.prisma.youtubeChannel.findUnique({ where: { userId } });
        if (!channel)
            return null;
        try {
            const accessToken = await this.getAccessToken(userId);
            const res = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://www.googleapis.com/youtube/v3/channels', {
                params: { part: 'snippet,statistics', mine: true },
                headers: { Authorization: `Bearer ${accessToken}` },
            }));
            const item = res.data.items?.[0];
            if (!item)
                return null;
            return {
                channelId: item.id,
                name: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails?.default?.url ?? null,
                subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
                videoCount: parseInt(item.statistics.videoCount || '0', 10),
            };
        }
        catch {
            return {
                channelId: channel.channelId,
                name: channel.name ?? '',
                thumbnailUrl: channel.thumbnailUrl ?? null,
                subscriberCount: 0,
                videoCount: 0,
            };
        }
    }
    async getVideoAnalytics(userId, youtubeVideoId) {
        const accessToken = await this.getAccessToken(userId);
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const res = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://youtubeanalytics.googleapis.com/v2/reports', {
            params: {
                ids: 'channel==MINE',
                startDate: thirtyDaysAgo,
                endDate: today,
                metrics: 'views,estimatedMinutesWatched,likes,subscribersGained,annotationClickThroughRate',
                dimensions: 'day',
                filters: `video==${youtubeVideoId}`,
            },
            headers: { Authorization: `Bearer ${accessToken}` },
        }));
        const rows = res.data.rows ?? [];
        const dailyStats = rows.map(([date, views, watchTime, likes, subs, ctr]) => ({
            date,
            views,
            watchTime,
            likes,
            subscribersGained: subs,
            ctr: Math.round(ctr * 10000) / 100,
        }));
        return {
            views: dailyStats.reduce((s, r) => s + r.views, 0),
            watchTime: dailyStats.reduce((s, r) => s + r.watchTime, 0),
            likes: dailyStats.reduce((s, r) => s + r.likes, 0),
            subscribersGained: dailyStats.reduce((s, r) => s + r.subscribersGained, 0),
            ctr: dailyStats.length ? dailyStats.reduce((s, r) => s + r.ctr, 0) / dailyStats.length : 0,
            dailyStats,
        };
    }
    async getChannelAnalytics(userId) {
        const accessToken = await this.getAccessToken(userId);
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const res = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://youtubeanalytics.googleapis.com/v2/reports', {
            params: {
                ids: 'channel==MINE',
                startDate: thirtyDaysAgo,
                endDate: today,
                metrics: 'views,estimatedMinutesWatched,likes,subscribersGained',
                dimensions: 'day',
            },
            headers: { Authorization: `Bearer ${accessToken}` },
        }));
        const rows = res.data.rows ?? [];
        const dailyStats = rows.map(([date, views, watchTime, likes, subs]) => ({
            date,
            views,
            watchTime,
            likes,
            subscribersGained: subs,
        }));
        return {
            totalViews: dailyStats.reduce((s, r) => s + r.views, 0),
            totalWatchTime: dailyStats.reduce((s, r) => s + r.watchTime, 0),
            totalLikes: dailyStats.reduce((s, r) => s + r.likes, 0),
            totalSubscribersGained: dailyStats.reduce((s, r) => s + r.subscribersGained, 0),
            dailyStats,
        };
    }
    async disconnectChannel(userId) {
        const channel = await this.prisma.youtubeChannel.findUnique({ where: { userId } });
        if (!channel)
            return;
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(`https://oauth2.googleapis.com/revoke?token=${channel.accessToken}`, {}));
        }
        catch {
            // Ignore revoke errors — still remove locally
        }
        await this.prisma.youtubeChannel.delete({ where: { userId } });
    }
};
exports.YoutubeService = YoutubeService;
exports.YoutubeService = YoutubeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        axios_1.HttpService,
        config_1.ConfigService,
        video_gateway_1.VideoGateway])
], YoutubeService);
//# sourceMappingURL=youtube.service.js.map