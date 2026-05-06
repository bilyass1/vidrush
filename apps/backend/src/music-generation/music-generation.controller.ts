import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MusicGenerationService } from './music-generation.service';
import { GenerateMusicDto } from './dto/generate-music.dto';

@Controller('music')
@UseGuards(JwtAuthGuard)
export class MusicGenerationController {
  constructor(private readonly musicService: MusicGenerationService) {}

  @Post('generate')
  async generateMusic(@Request() req: any, @Body() dto: GenerateMusicDto) {
    return this.musicService.generateMusic(req.user.userId, dto);
  }

  @Get('status/:projectId')
  async getStatus(@Request() req: any, @Param('projectId') projectId: string) {
    return this.musicService.getProjectStatus(projectId, req.user.userId);
  }

  @Get('list')
  async listProjects(@Request() req: any) {
    return this.musicService.listUserProjects(req.user.userId);
  }
}
