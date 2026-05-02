import { Plan } from "./enums";

export interface User {
  id: string;
  email: string;
  name: string;
  /** Never expose this over API — server-side only */
  passwordHash?: string;
  plan: Plan;
  stripeCustomerId: string | null;
  youtubeRefreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe user shape returned by API (no sensitive fields) */
export type PublicUser = Omit<User, "passwordHash" | "youtubeRefreshToken">;
