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
exports.YoutubeController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const youtube_service_1 = require("./youtube.service");
class UploadVideoDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadVideoDto.prototype, "videoGenerationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UploadVideoDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UploadVideoDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UploadVideoDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['public', 'unlisted', 'private']),
    __metadata("design:type", String)
], UploadVideoDto.prototype, "privacy", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadVideoDto.prototype, "isShort", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadVideoDto.prototype, "scheduledAt", void 0);
let YoutubeController = class YoutubeController {
    constructor(youtubeService, config) {
        this.youtubeService = youtubeService;
        this.config = config;
    }
    getAuthUrl(req) {
        const { userId } = req.user;
        const url = this.youtubeService.getAuthUrl(userId);
        return { url };
    }
    async handleCallback(code, state, res) {
        const userId = Buffer.from(state, 'base64').toString('utf-8');
        await this.youtubeService.handleCallback(code, userId);
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
        return res.redirect(`${frontendUrl}/dashboard/settings?tab=youtube&connected=true`);
    }
    async getChannel(req) {
        const { userId } = req.user;
        return this.youtubeService.getChannelInfo(userId);
    }
    async uploadVideo(req, dto) {
        const { userId } = req.user;
        return this.youtubeService.uploadVideo(userId, dto);
    }
    async getChannelAnalytics(req) {
        const { userId } = req.user;
        return this.youtubeService.getChannelAnalytics(userId);
    }
    async getVideoAnalytics(req, youtubeVideoId) {
        const { userId } = req.user;
        return this.youtubeService.getVideoAnalytics(userId, youtubeVideoId);
    }
    async disconnect(req) {
        const { userId } = req.user;
        await this.youtubeService.disconnectChannel(userId);
        return { success: true };
    }
};
exports.YoutubeController = YoutubeController;
__decorate([
    (0, common_1.Get)('auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], YoutubeController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], YoutubeController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('channel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], YoutubeController.prototype, "getChannel", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UploadVideoDto]),
    __metadata("design:returntype", Promise)
], YoutubeController.prototype, "uploadVideo", null);
__decorate([
    (0, common_1.Get)('analytics/channel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], YoutubeController.prototype, "getChannelAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/video/:youtubeVideoId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('youtubeVideoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], YoutubeController.prototype, "getVideoAnalytics", null);
__decorate([
    (0, common_1.Delete)('disconnect'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], YoutubeController.prototype, "disconnect", null);
exports.YoutubeController = YoutubeController = __decorate([
    (0, common_1.Controller)('youtube'),
    __metadata("design:paramtypes", [youtube_service_1.YoutubeService,
        config_1.ConfigService])
], YoutubeController);
//# sourceMappingURL=youtube.controller.js.map