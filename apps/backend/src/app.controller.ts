import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { AppService } from "./app.service";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
