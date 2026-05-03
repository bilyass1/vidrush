import { Controller, Get, Post, Body, Param, Req, UseGuards, Query, Delete, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { VideoService } from "./video.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UsersService } from "../users/users.service";
import { VideoGenerationService } from "../video-generation/video-generation.service";
import { GenerateVideoDto } from "../video-generation/dto/generate-video.dto";
import { DirectGenerateDto } from "../video-generation/dto/direct-generate.dto";
import { ElevenLabsService } from "../video-generation/services/elevenlabs.service";
import { LtxService } from "../video-generation/services/ltx.service";

@Controller("video")
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly usersService: UsersService,
    private readonly videoGenerationService: VideoGenerationService,
    private readonly elevenLabsService: ElevenLabsService,
    private readonly ltxService: LtxService,
  ) {}

  @Post("direct-generate")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('referenceImage', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  }))
  async directGenerate(
    @Req() req: Request,
    @Body() dto: DirectGenerateDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const { userId } = req.user as any;
    return this.videoGenerationService.startDirectGeneration(userId, dto, file);
  }

  @Post("script-preview")
  @UseGuards(JwtAuthGuard)
  async previewScript(@Body() dto: GenerateVideoDto) {
    return this.videoGenerationService.generateScriptPreview(dto);
  }

  @Post("generate")
  @UseGuards(JwtAuthGuard)
  async generate(@Req() req: Request, @Body() dto: GenerateVideoDto) {
    const { userId } = req.user as any;
    return this.videoGenerationService.startGeneration(userId, dto);
  }

  @Get("status/:jobId")
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: Request, @Param("jobId") jobId: string) {
    const { userId } = req.user as any;
    return this.videoGenerationService.getStatus(jobId, userId);
  }

  @Get("list")
  @UseGuards(JwtAuthGuard)
  async getList(@Req() req: Request) {
    const { userId } = req.user as any;
    return this.videoGenerationService.getUserVideos(userId);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  async getStats(@Req() req: Request) {
    const { userId } = req.user as { userId: string; email: string };
    const user = await this.usersService.findById(userId);
    if (!user) {
      return { totalVideos: 0, minutesUsed: 0, minutesLimit: 5, publishedCount: 0, thisMonthCount: 0 };
    }
    return this.videoService.getStats(userId, user.plan);
  }

  @Get("recent")
  @UseGuards(JwtAuthGuard)
  async getRecent(@Req() req: Request, @Query("limit") limit?: string) {
    const { userId } = req.user as any;
    return this.videoGenerationService.getRecent(userId, limit ? parseInt(limit) : 6);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async deleteVideo(@Req() req: Request, @Param("id") id: string) {
    const { userId } = req.user as any;
    await this.videoGenerationService.deleteVideo(id, userId);
    return { success: true };
  }

  @Post("project/save")
  @UseGuards(JwtAuthGuard)
  async saveProject(@Req() req: Request, @Body() body: { title: string; videoPath: string; timeline: any }) {
    const { userId } = req.user as { userId: string; email: string };
    return this.videoService.saveProject(userId, body.title, body.videoPath, body.timeline);
  }

  @Get("project/list")
  @UseGuards(JwtAuthGuard)
  async listProjects(@Req() req: Request) {
    const { userId } = req.user as { userId: string; email: string };
    return this.videoService.listProjects(userId);
  }

  @Get("project/:id")
  @UseGuards(JwtAuthGuard)
  async getProject(@Req() req: Request, @Param("id") id: string) {
    const { userId } = req.user as { userId: string; email: string };
    return this.videoService.getProject(userId, id);
  }

  @Get("voices/available")
  async getAvailableVoices() {
    return this.elevenLabsService.getAvailableVoices();
  }

  @Post("voices/test")
  @UseGuards(JwtAuthGuard)
  async testVoice(@Body() body: { text: string; voiceId: string; modelId?: string }) {
    const audio = await this.elevenLabsService.testVoice(
      body.text,
      body.voiceId,
      body.modelId || 'eleven_turbo_v2_5',
    );
    return {
      audioBase64: audio.toString('base64'),
      audioSize: audio.length,
      format: 'mp3',
    };
  }

  @Get("api-status")
  @UseGuards(JwtAuthGuard)
  async getApiStatus() {
    const ltxConnected = await this.ltxService.checkHealth();
    return {
      ltxServer: {
        connected: ltxConnected,
        url: process.env.LTX_SERVER_URL ?? 'https://vault-folk-delivery-illustration.trycloudflare.com',
      },
    };
  }
}
