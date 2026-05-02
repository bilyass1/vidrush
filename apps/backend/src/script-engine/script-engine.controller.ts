import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ScriptEngineService } from './script-engine.service';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('script-engine')
@UseGuards(JwtAuthGuard)
export class ScriptEngineController {
  constructor(private readonly scriptEngineService: ScriptEngineService) {}

  /** Generate script only — for "Generate Script First" flow */
  @Post('generate-script')
  async generateScript(@Body() dto: GenerateScriptDto) {
    return this.scriptEngineService.generateScriptAndPrompts(dto);
  }

  /** Generate script + immediately trigger LTX — for "Generate Video Directly" flow */
  @Post('generate-video')
  async generateVideo(@Req() req: Request, @Body() dto: GenerateScriptDto) {
    const { userId } = req.user as any;
    return this.scriptEngineService.generateVideoDirectly(userId, dto);
  }

  /** Poll project status */
  @Get('status/:projectId')
  async getStatus(@Req() req: Request, @Param('projectId') projectId: string) {
    const { userId } = req.user as any;
    return this.scriptEngineService.getProjectStatus(projectId, userId);
  }
}
