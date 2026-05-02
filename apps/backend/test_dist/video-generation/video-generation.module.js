"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoGenerationModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const prisma_module_1 = require("../prisma/prisma.module");
const bull_1 = require("@nestjs/bull");
const users_module_1 = require("../users/users.module");
const video_module_1 = require("../video/video.module");
const gemini_service_1 = require("./services/gemini.service");
const elevenlabs_service_1 = require("./services/elevenlabs.service");
const veo_service_1 = require("./services/veo.service");
const shotstack_service_1 = require("./services/shotstack.service");
const video_generation_service_1 = require("./video-generation.service");
const video_generation_processor_1 = require("./video-generation.processor");
const gateway_module_1 = require("../gateway/gateway.module");
let VideoGenerationModule = class VideoGenerationModule {
};
exports.VideoGenerationModule = VideoGenerationModule;
exports.VideoGenerationModule = VideoGenerationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            axios_1.HttpModule,
            bull_1.BullModule.registerQueue({
                name: 'video-generation',
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            }),
            users_module_1.UsersModule,
            (0, common_1.forwardRef)(() => video_module_1.VideoModule),
            gateway_module_1.GatewayModule,
        ],
        controllers: [],
        providers: [
            gemini_service_1.GeminiService,
            elevenlabs_service_1.ElevenLabsService,
            veo_service_1.VeoService,
            shotstack_service_1.ShotstackService,
            video_generation_service_1.VideoGenerationService,
            video_generation_processor_1.VideoGenerationProcessor,
        ],
        exports: [video_generation_service_1.VideoGenerationService],
    })
], VideoGenerationModule);
//# sourceMappingURL=video-generation.module.js.map