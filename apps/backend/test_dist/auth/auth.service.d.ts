import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { RegisterDto, LoginDto } from "./dto";
export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<AuthTokens>;
    login(dto: LoginDto): Promise<AuthTokens>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    validateGoogleUser(profile: {
        email: string;
        displayName: string;
        refreshToken?: string;
    }): Promise<AuthTokens>;
    generateTokens(userId: string, email: string): AuthTokens;
}
//# sourceMappingURL=auth.service.d.ts.map