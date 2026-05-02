import {
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export const SCRIPT_GENRES = [
  'Documentary', 'Dark History', 'True Crime', 'Educational',
  'Funny', 'History', 'Horror', 'Science', 'News', 'Motivation',
] as const;

export const SCRIPT_ASPECT_RATIOS = ['16:9', '9:16', '1:1'] as const;
export const SCRIPT_LANGUAGES = ['en-us', 'en-uk', 'fr', 'ar'] as const;
export const SCRIPT_GENERATION_MODES = ['free', 'premium'] as const;

export class GenerateScriptDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  idea!: string;

  @IsString()
  @IsIn(SCRIPT_GENRES)
  genre!: string;

  @IsString()
  @IsIn(SCRIPT_ASPECT_RATIOS)
  aspectRatio!: string;

  @IsString()
  @IsIn(SCRIPT_LANGUAGES)
  language!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(8)
  @Max(2400)
  durationSeconds!: number;

  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  @IsString()
  @IsIn(SCRIPT_GENERATION_MODES)
  generationMode?: 'free' | 'premium';
}
