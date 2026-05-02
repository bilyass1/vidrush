import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
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

const STATUS_MESSAGES: Record<VideoStatus, string> = {
  PENDING: 'Starting generation...',
  SCRIPTING: 'Writing your script with AI...',
  VOICING: 'Generating voiceover...',
  GENERATING: 'Creating video clips...',
  RENDERING: 'Assembling final video...',
  DONE: 'Your video is ready!',
  FAILED: 'Generation failed. Please try again.',
};

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/video-progress',
})
export class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(VideoGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth.token as string;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<{ sub: string }>(token);
      client.data.userId = payload.sub;
      client.join(`user_${payload.sub}`);
      this.logger.log(`Client connected: ${client.id}, user: ${payload.sub}`);
    } catch {
      this.logger.warn(`Unauthorized WebSocket connection: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitProgress(userId: string, data: ProgressEvent): void {
    this.server.to(`user_${userId}`).emit('video:progress', data);
  }

  emitUploadProgress(userId: string, data: { progress: number; youtubeVideoId?: string }): void {
    this.server.to(`user_${userId}`).emit('youtube:upload_progress', data);
  }

  getMessageForStatus(status: VideoStatus): string {
    return STATUS_MESSAGES[status] ?? 'Processing...';
  }
}
