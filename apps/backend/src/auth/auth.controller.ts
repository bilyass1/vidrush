import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, RefreshDto } from "./dto";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UsersService } from "../users/users.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const { userId } = req.user as { userId: string; email: string };
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      hasYoutubeConnected: !!user.youtubeRefreshToken,
    };
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as {
      email: string;
      displayName: string;
      refreshToken?: string;
    };

    const tokens = await this.authService.validateGoogleUser(user);

    // Redirect to frontend with tokens as query params
    const params = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    res.redirect(`http://localhost:3000/auth/callback?${params.toString()}`);
  }
}
