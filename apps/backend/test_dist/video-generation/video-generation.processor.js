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
var VideoGenerationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoGenerationProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const gemini_service_1 = require("./services/gemini.service");
const elevenlabs_service_1 = require("./services/elevenlabs.service");
const veo_service_1 = require("./services/veo.service");
const shotstack_service_1 = require("./services/shotstack.service");
const video_gateway_1 = require("../gateway/video.gateway");
const VOICE_ID_MAP = {
    Documentary: 'pNInz6obpgDQGcFmaJgB',
    'Dark History': 'ErXwobaYiN019PkySvjV',
    'True Crime': 'AZnzlk1XvdvUeBnXmlld',
    Educational: 'EXAVITQu4vr4xnSDxMaL',
    Funny: 'EXAVITQu4vr4xnSDxMaL',
    History: 'pNInz6obpgDQGcFmaJgB',
    Horror: 'ErXwobaYiN019PkySvjV',
    Science: 'EXAVITQu4vr4xnSDxMaL',
    News: 'pNInz6obpgDQGcFmaJgB',
    Motivation: 'AZnzlk1XvdvUeBnXmlld',
};
function getVoiceId(genre) {
    return VOICE_ID_MAP[genre] ?? VOICE_ID_MAP['Documentary'];
}
let VideoGenerationProcessor = VideoGenerationProcessor_1 = class VideoGenerationProcessor {
    constructor(prisma, geminiService, elevenLabsService, veoService, shotstackService, videoGateway) {
        this.prisma = prisma;
        this.geminiService = geminiService;
        this.elevenLabsService = elevenLabsService;
        this.veoService = veoService;
        this.shotstackService = shotstackService;
        this.videoGateway = videoGateway;
        this.logger = new common_1.Logger(VideoGenerationProcessor_1.name);
    }
    async processYoutube(job) {
        const { videoGenerationId, userId, topic, duration, genre, market } = job.data;
        const id = videoGenerationId;
        try {
            // STEP 1 — SCRIPTING (STORY CONTENT BUILDING)
            await this.updateStatus(id, userId, client_1.VideoStatus.SCRIPTING, 50);
            const script = await this.geminiService.generateScript(topic, duration, genre, market);
            this.logger.log(`Story content (script) generated for job ${id}: ${script.length} chars`);
            // FOR NOW: Complete the job after story content is built
            await this.updateStatus(id, userId, client_1.VideoStatus.DONE, 100);
            await this.prisma.videoGeneration.update({
                where: { id },
                data: {
                    status: client_1.VideoStatus.DONE,
                    inputPrompt: `${topic} | Script: ${script.slice(0, 1000)}...` // Storing script in inputPrompt or similar for now
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Job ${id} failed: ${message}`);
            await this.updateStatus(id, userId, client_1.VideoStatus.FAILED, 0);
            await this.prisma.videoGeneration.update({
                where: { id },
                data: { status: client_1.VideoStatus.FAILED },
            });
            throw error;
        }
    }
    async updateStatus(id, userId, status, progress, outputUrl) {
        await this.prisma.videoGeneration.update({
            where: { id },
            data: { status },
        });
        this.videoGateway.emitProgress(userId, {
            videoGenerationId: id,
            status,
            progress,
            message: this.videoGateway.getMessageForStatus(status),
            outputUrl,
        });
    }
};
exports.VideoGenerationProcessor = VideoGenerationProcessor;
__decorate([
    (0, bull_1.Process)('generate-youtube'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoGenerationProcessor.prototype, "processYoutube", null);
exports.VideoGenerationProcessor = VideoGenerationProcessor = VideoGenerationProcessor_1 = __decorate([
    (0, bull_1.Processor)('video-generation'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gemini_service_1.GeminiService,
        elevenlabs_service_1.ElevenLabsService,
        veo_service_1.VeoService,
        shotstack_service_1.ShotstackService,
        video_gateway_1.VideoGateway])
], VideoGenerationProcessor);
//# sourceMappingURL=video-generation.processor.js.map