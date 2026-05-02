import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { VideoStatus } from '@prisma/client';
export interface ProgressEvent {
    videoGenerationId: string;
    status: VideoStatus;
    progress: number;
    message: string;
    outputUrl?: string;
}
export declare class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    emitProgress(userId: string, data: ProgressEvent): void;
    emitUploadProgress(userId: string, data: {
        progress: number;
        youtubeVideoId?: string;
    }): void;
    getMessageForStatus(status: VideoStatus): string;
}
//# sourceMappingURL=video.gateway.d.ts.map