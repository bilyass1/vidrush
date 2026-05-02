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
exports.VideoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PLAN_LIMITS = {
    FREE: 5,
    STARTER: 15,
    PRO: 50,
    PAYG: 9999,
};
let VideoService = class VideoService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(userId, userPlan) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [totalVideos, thisMonthVideos, publishedCount, minutesAgg] = await Promise.all([
            this.prisma.videoGeneration.count({
                where: { userId },
            }),
            this.prisma.videoGeneration.count({
                where: {
                    userId,
                    createdAt: { gte: startOfMonth },
                },
            }),
            this.prisma.videoGeneration.count({
                where: {
                    userId,
                    type: "YOUTUBE",
                    outputUrl: { not: null },
                },
            }),
            this.prisma.videoGeneration.aggregate({
                where: {
                    userId,
                    createdAt: { gte: startOfMonth },
                },
                _sum: { durationMin: true },
            }),
        ]);
        return {
            totalVideos,
            minutesUsed: minutesAgg._sum.durationMin ?? 0,
            minutesLimit: PLAN_LIMITS[userPlan],
            publishedCount,
            thisMonthCount: thisMonthVideos,
        };
    }
    async getRecentVideos(userId, limit = 6) {
        return this.prisma.videoGeneration.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }
    async saveProject(userId, title, videoPath, timeline) {
        // We try to find by title + userId to "upsert" manually since title isn't unique in schema
        const existing = await this.prisma.videoProject.findFirst({
            where: { userId, title },
        });
        if (existing) {
            return this.prisma.videoProject.update({
                where: { id: existing.id },
                data: { timeline, updatedAt: new Date() },
            });
        }
        return this.prisma.videoProject.create({
            data: {
                userId,
                title,
                timeline,
            },
        });
    }
    async listProjects(userId) {
        return this.prisma.videoProject.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                updatedAt: true,
            },
        });
    }
    async getProject(userId, id) {
        return this.prisma.videoProject.findFirst({
            where: { id, userId },
        });
    }
};
exports.VideoService = VideoService;
exports.VideoService = VideoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VideoService);
//# sourceMappingURL=video.service.js.map