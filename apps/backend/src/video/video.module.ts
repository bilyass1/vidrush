import { Module, forwardRef } from "@nestjs/common";
import { VideoController } from "./video.controller";
import { VideoService } from "./video.service";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { VideoGenerationModule } from "../video-generation/video-generation.module";

@Module({
  imports: [
    PrismaModule, 
    UsersModule, 
    forwardRef(() => VideoGenerationModule)
  ],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
