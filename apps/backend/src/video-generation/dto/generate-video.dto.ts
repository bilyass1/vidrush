import { IsString, IsNumber, MinLength, MaxLength, Min, Max, IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export const VIDEO_GENRES = [
  'Documentary', 'Dark History', 'True Crime', 'Educational',
  'Funny', 'History', 'Horror', 'Science', 'News', 'Motivation',
] as const;

export const VIDEO_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5'] as const;
export const VIDEO_MARKETS = ['en-us', 'en-uk', 'fr', 'ar'] as const;
export const VIDEO_PIPELINES = ['free', 'premium'] as const;

export class GenerateVideoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  topic!: string;

  @IsString()
  @IsIn(VIDEO_GENRES)
  genre!: string;

  @IsString()
  @IsIn(VIDEO_ASPECT_RATIOS)
  aspectRatio!: string;

  @IsString()
  @IsIn(VIDEO_MARKETS)
  market!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(8)
  @Max(1600)
  duration!: number; // in seconds

  @IsOptional()
  @IsString()
  @IsIn(VIDEO_PIPELINES)
  pipeline: 'free' | 'premium' = 'free';
}
