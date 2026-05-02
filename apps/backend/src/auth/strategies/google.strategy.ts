import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID")!,
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET")!,
      callbackURL: configService.get<string>("GOOGLE_CALLBACK_URL")!,
      scope: [
        "email",
        "profile",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
      ],
      accessType: "offline",
      prompt: "consent",
    });
  }

  validate(
    _accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("No email found in Google profile"), undefined);
      return;
    }

    done(null, {
      email,
      displayName: profile.displayName,
      refreshToken,
    });
  }
}
