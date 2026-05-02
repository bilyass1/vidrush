import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';
import { YoutubeService } from './youtube.service';
import { YoutubeController } from './youtube.controller';

@Module({
  imports: [PrismaModule, HttpModule, GatewayModule],
  providers: [YoutubeService],
  controllers: [YoutubeController],
  exports: [YoutubeService],
})
export class YoutubeModule {}
