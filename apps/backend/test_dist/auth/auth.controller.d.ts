import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, RefreshDto } from "./dto";
import { UsersService } from "../users/users.service";
export declare class AuthController {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    register(dto: RegisterDto): Promise<import("./auth.service").AuthTokens>;
    login(dto: LoginDto): Promise<import("./auth.service").AuthTokens>;
    refresh(dto: RefreshDto): Promise<import("./auth.service").AuthTokens>;
    me(req: Request): Promise<{
        id: string;
        email: string;
        name: string;
        plan: import(".prisma/client").$Enums.Plan;
        hasYoutubeConnected: boolean;
    } | null>;
    googleAuth(): void;
    googleCallback(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map