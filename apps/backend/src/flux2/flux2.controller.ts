import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Flux2Service } from './flux2.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@Controller('flux2')
@UseGuards(JwtAuthGuard)
export class Flux2Controller {
  constructor(private readonly flux2Service: Flux2Service) {}

  @Post('generate')
  @UseInterceptors(
    FileInterceptor('referenceImage', {
      storage: diskStorage({
        destination: './uploads/flux2-references',
        filename: (req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async generateImage(
    @Body() dto: GenerateImageDto,
    @UploadedFile() referenceImage?: Express.Multer.File,
  ) {
    const result = await this.flux2Service.generateImageWithRetry({
      prompt: dto.prompt,
      referenceImagePath: referenceImage?.path,
      width: dto.width,
      height: dto.height,
      steps: dto.steps,
      guidance: dto.guidance,
      seed: dto.seed,
      enableTurbo: dto.enableTurbo ?? true,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('health')
  async checkHealth() {
    const isHealthy = await this.flux2Service.checkHealth();
    return {
      success: isHealthy,
      connected: isHealthy,
      url: process.env.COMFYUI_URL ?? 'https://hammer-helmet-sue-hunter.trycloudflare.com',
    };
  }
}
