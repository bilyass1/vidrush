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
exports.VideoController = void 0;
const common_1 = require("@nestjs/common");
const video_service_1 = require("./video.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("../users/users.service");
const video_generation_service_1 = require("../video-generation/video-generation.service");
const generate_video_dto_1 = require("../video-generation/dto/generate-video.dto");
let VideoController = class VideoController {
    constructor(videoService, usersService, videoGenerationService) {
        this.videoService = videoService;
        this.usersService = usersService;
        this.videoGenerationService = videoGenerationService;
    }
    async previewScript(dto) {
        return this.videoGenerationService.generateScriptPreview(dto);
    }
    async generate(req, dto) {
        const { userId } = req.user;
        return this.videoGenerationService.startGeneration(userId, dto);
    }
    async getStatus(req, jobId) {
        const { userId } = req.user;
        return this.videoGenerationService.getStatus(jobId, userId);
    }
    async getList(req) {
        const { userId } = req.user;
        return this.videoGenerationService.getUserVideos(userId);
    }
    async getStats(req) {
        const { userId } = req.user;
        const user = await this.usersService.findById(userId);
        if (!user) {
            return { totalVideos: 0, minutesUsed: 0, minutesLimit: 5, publishedCount: 0, thisMonthCount: 0 };
        }
        return this.videoService.getStats(userId, user.plan);
    }
    async getRecent(req, limit) {
        const { userId } = req.user;
        return this.videoGenerationService.getRecent(userId, limit ? parseInt(limit) : 6);
    }
    async deleteVideo(req, id) {
        const { userId } = req.user;
        await this.videoGenerationService.deleteVideo(id, userId);
        return { success: true };
    }
    async saveProject(req, body) {
        const { userId } = req.user;
        return this.videoService.saveProject(userId, body.title, body.videoPath, body.timeline);
    }
    async listProjects(req) {
        const { userId } = req.user;
        return this.videoService.listProjects(userId);
    }
    async getProject(req, id) {
        const { userId } = req.user;
        return this.videoService.getProject(userId, id);
    }
};
exports.VideoController = VideoController;
__decorate([
    (0, common_1.Post)("script-preview"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_video_dto_1.GenerateVideoDto]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "previewScript", null);
__decorate([
    (0, common_1.Post)("generate"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_video_dto_1.GenerateVideoDto]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)("status/:jobId"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("jobId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)("list"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getList", null);
__decorate([
    (0, common_1.Get)("stats"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)("recent"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getRecent", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "deleteVideo", null);
__decorate([
    (0, common_1.Post)("project/save"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "saveProject", null);
__decorate([
    (0, common_1.Get)("project/list"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "listProjects", null);
__decorate([
    (0, common_1.Get)("project/:id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getProject", null);
exports.VideoController = VideoController = __decorate([
    (0, common_1.Controller)("video"),
    __metadata("design:paramtypes", [video_service_1.VideoService,
        users_service_1.UsersService,
        video_generation_service_1.VideoGenerationService])
], VideoController);
//# sourceMappingURL=video.controller.js.map