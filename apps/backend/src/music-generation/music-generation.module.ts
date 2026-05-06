import { Module } from '@nestjs/common';
import { MusicGenerationController } from './music-generation.controller';
import { MusicGenerationService } from './music-generation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [MusicGenerationController],
  providers: [MusicGenerationService],
  exports: [MusicGenerationService],
})
export class MusicGenerationModule {}
