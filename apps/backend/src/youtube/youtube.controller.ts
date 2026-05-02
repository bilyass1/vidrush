import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { IsString, IsArray, IsBoolean, IsOptional, MaxLength, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { YoutubeService } from './youtube.service';

class UploadVideoDto {
  @IsString()
  videoGenerationId!: string;

  @IsString()
  @MaxLength(100)
  title!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsIn(['public', 'unlisted', 'private'])
  privacy!: 'public' | 'unlisted' | 'private';

  @IsBoolean()
  isShort!: boolean;

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}

@Controller('youtube')
export class YoutubeController {
  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly config: ConfigService,
  ) {}

  @Get('auth')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@Req() req: Request): { url: string } {
    const { userId } = req.user as any;
    const url = this.youtubeService.getAuthUrl(userId);
    return { url };
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const userId = Buffer.from(state, 'base64').toString('utf-8');
    await this.youtubeService.handleCallback(code, userId);
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return res.redirect(`${frontendUrl}/dashboard/settings?tab=youtube&connected=true`);
  }

  @Get('channel')
  @UseGuards(JwtAuthGuard)
  async getChannel(@Req() req: Request) {
    const { userId } = req.user as any;
    return this.youtubeService.getChannelInfo(userId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  async uploadVideo(@Req() req: Request, @Body() dto: UploadVideoDto) {
    const { userId } = req.user as any;
    return this.youtubeService.uploadVideo(userId, dto);
  }

  @Get('analytics/channel')
  @UseGuards(JwtAuthGuard)
  async getChannelAnalytics(@Req() req: Request) {
    const { userId } = req.user as any;
    return this.youtubeService.getChannelAnalytics(userId);
  }

  @Get('analytics/video/:youtubeVideoId')
  @UseGuards(JwtAuthGuard)
  async getVideoAnalytics(
    @Req() req: Request,
    @Param('youtubeVideoId') youtubeVideoId: string,
  ) {
    const { userId } = req.user as any;
    return this.youtubeService.getVideoAnalytics(userId, youtubeVideoId);
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Req() req: Request) {
    const { userId } = req.user as any;
    await this.youtubeService.disconnectChannel(userId);
    return { success: true };
  }
}
