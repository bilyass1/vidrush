"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException("Email already registered");
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.usersService.create({
            email: dto.email,
            name: dto.name,
            passwordHash,
        });
        return this.generateTokens(user.id, user.email);
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        return this.generateTokens(user.id, user.email);
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get("JWT_REFRESH_SECRET"),
            });
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new common_1.UnauthorizedException("User not found");
            }
            return this.generateTokens(user.id, user.email);
        }
        catch {
            throw new common_1.UnauthorizedException("Invalid refresh token");
        }
    }
    async validateGoogleUser(profile) {
        let user = await this.usersService.findByEmail(profile.email);
        if (user) {
            // Update YouTube refresh token if provided
            if (profile.refreshToken) {
                await this.usersService.updateUser(user.id, {
                    youtubeRefreshToken: profile.refreshToken,
                });
            }
        }
        else {
            // Create new user from Google profile (no password needed)
            user = await this.usersService.create({
                email: profile.email,
                name: profile.displayName,
                passwordHash: "", // OAuth users don't have a local password
            });
        }
        return this.generateTokens(user.id, user.email);
    }
    generateTokens(userId, email) {
        const payload = { sub: userId, email };
        const access_token = this.jwtService.sign(payload, {
            secret: this.configService.get("JWT_SECRET"),
            expiresIn: "15m",
        });
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get("JWT_REFRESH_SECRET"),
            expiresIn: "7d",
        });
        return { access_token, refresh_token };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map