import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { RegisterDto, LoginDto } from "./dto";

interface TokenPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.generateTokens(user.id, user.email);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async validateGoogleUser(profile: {
    email: string;
    displayName: string;
    refreshToken?: string;
  }): Promise<AuthTokens> {
    let user = await this.usersService.findByEmail(profile.email);

    if (user) {
      // Update YouTube refresh token if provided
      if (profile.refreshToken) {
        await this.usersService.updateUser(user.id, {
          youtubeRefreshToken: profile.refreshToken,
        });
      }
    } else {
      // Create new user from Google profile (no password needed)
      user = await this.usersService.create({
        email: profile.email,
        name: profile.displayName,
        passwordHash: "", // OAuth users don't have a local password
      });
    }

    return this.generateTokens(user.id, user.email);
  }

  generateTokens(userId: string, email: string): AuthTokens {
    const payload: TokenPayload = { sub: userId, email };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: "15m",
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: "7d",
    });

    return { access_token, refresh_token };
  }
}
