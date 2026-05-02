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
var VideoGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const STATUS_MESSAGES = {
    PENDING: 'Starting generation...',
    SCRIPTING: 'Writing your script with AI...',
    VOICING: 'Generating voiceover...',
    GENERATING: 'Creating video clips...',
    RENDERING: 'Assembling final video...',
    DONE: 'Your video is ready!',
    FAILED: 'Generation failed. Please try again.',
};
let VideoGateway = VideoGateway_1 = class VideoGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(VideoGateway_1.name);
    }
    handleConnection(client) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
            client.join(`user_${payload.sub}`);
            this.logger.log(`Client connected: ${client.id}, user: ${payload.sub}`);
        }
        catch {
            this.logger.warn(`Unauthorized WebSocket connection: ${client.id}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    emitProgress(userId, data) {
        this.server.to(`user_${userId}`).emit('video:progress', data);
    }
    emitUploadProgress(userId, data) {
        this.server.to(`user_${userId}`).emit('youtube:upload_progress', data);
    }
    getMessageForStatus(status) {
        return STATUS_MESSAGES[status] ?? 'Processing...';
    }
};
exports.VideoGateway = VideoGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], VideoGateway.prototype, "server", void 0);
exports.VideoGateway = VideoGateway = VideoGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/video-progress',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], VideoGateway);
//# sourceMappingURL=video.gateway.js.map