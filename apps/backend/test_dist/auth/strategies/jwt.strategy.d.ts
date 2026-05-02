import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-jwt";
interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): {
        userId: string;
        email: string;
    };
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map