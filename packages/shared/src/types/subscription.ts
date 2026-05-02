import { Plan, SubscriptionStatus } from "./enums";

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date;
  createdAt: Date;
}
