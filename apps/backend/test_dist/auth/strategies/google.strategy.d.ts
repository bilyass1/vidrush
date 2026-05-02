import { ConfigService } from "@nestjs/config";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";
declare const GoogleStrategy_base: new (...args: any[]) => Strategy;
export declare class GoogleStrategy extends GoogleStrategy_base {
    constructor(configService: ConfigService);
    validate(_accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): void;
}
export {};
//# sourceMappingURL=google.strategy.d.ts.map