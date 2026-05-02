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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoGenerationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bull_1 = require("@nestjs/bull");
const client_1 = require("@prisma/client");
const gemini_service_1 = require("./services/gemini.service");
let VideoGenerationService = class VideoGenerationService {
    constructor(prisma, videoQueue, geminiService) {
        this.prisma = prisma;
        this.videoQueue = videoQueue;
        this.geminiService = geminiService;
    }
    async generateScriptPreview(dto) {
        return this.geminiService.generateScriptPreview(dto.topic, dto.duration, dto.genre, dto.aspectRatio, dto.market);
    }
    async startGeneration(userId, dto) {
        const durationMin = dto.duration / 60;
        const videoGeneration = await this.prisma.videoGeneration.create({
            data: {
                userId,
                type: client_1.VideoType.YOUTUBE,
                status: client_1.VideoStatus.PENDING,
                inputPrompt: dto.topic,
                durationMin,
            },
        });
        await this.videoQueue.add('generate-youtube', {
            videoGenerationId: videoGeneration.id,
            userId,
            ...dto,
        });
        return { jobId: videoGeneration.id };
    }
    async getStatus(jobId, userId) {
        const generation = await this.prisma.videoGeneration.findFirst({
            where: { id: jobId, userId },
        });
        if (!generation) {
            throw new common_1.NotFoundException('Job not found');
        }
        let progress = 0;
        switch (generation.status) {
            case client_1.VideoStatus.PENDING:
                progress = 0;
                break;
            case client_1.VideoStatus.SCRIPTING:
                progress = 10;
                break;
            case client_1.VideoStatus.VOICING:
                progress = 30;
                break;
            case client_1.VideoStatus.GENERATING:
                progress = 60;
                break;
            case client_1.VideoStatus.RENDERING:
                progress = 80;
                break;
            case client_1.VideoStatus.DONE:
                progress = 100;
                break;
            case client_1.VideoStatus.FAILED:
                progress = 0;
                break;
        }
        return {
            status: generation.status,
            progress,
            outputUrl: generation.outputUrl,
            error: null,
        };
    }
    async getUserVideos(userId) {
        return this.prisma.videoGeneration.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async getRecent(userId, limit) {
        return this.prisma.videoGeneration.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async deleteVideo(id, userId) {
        const generation = await this.prisma.videoGeneration.findFirst({
            where: { id, userId },
        });
        if (!generation) {
            throw new common_1.NotFoundException('Video not found');
        }
        await this.prisma.videoGeneration.update({
            where: { id },
            data: {
                status: client_1.VideoStatus.FAILED,
                outputUrl: null,
            },
        });
    }
};
exports.VideoGenerationService = VideoGenerationService;
exports.VideoGenerationService = VideoGenerationService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('video-generation')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, gemini_service_1.GeminiService])
], VideoGenerationService);
//# sourceMappingURL=video-generation.service.js.map