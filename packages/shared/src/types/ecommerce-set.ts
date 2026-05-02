import { Market } from "./enums";

export interface EcommerceSet {
  id: string;
  userId: string;
  productName: string;
  market: Market;
  inputImages: string[];
  outputPosters: string[];
  outputVideos: string[];
  scriptText: string | null;
  price: number | null;
  createdAt: Date;
}
