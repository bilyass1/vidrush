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

export const MUSIC_GENRES = [
  'Neo-Soul', 'Jazz', 'Blues', 'Rock', 'Pop', 'Hip-Hop', 
  'Electronic', 'Classical', 'Country', 'R&B', 'Reggae', 
  'Folk', 'Metal', 'Indie', 'Ambient'
] as const;

export const KEY_SCALES = [
  'C major', 'C minor', 'D major', 'D minor', 'E major', 'E minor',
  'F major', 'F minor', 'G major', 'G minor', 'A major', 'A minor',
  'B major', 'B minor'
] as const;

export const TIME_SIGNATURES = ['4', '3', '6', '5', '7'] as const;
export const LANGUAGES = ['en', 'fr', 'es', 'de', 'it', 'pt'] as const;

export class GenerateMusicDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  prompt!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  lyrics!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(999999)
  seed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  steps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  cfg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  shift?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(300)
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(60)
  @Max(240)
  bpm?: number;

  @IsOptional()
  @IsString()
  @IsIn(TIME_SIGNATURES)
  timeSignature?: string;

  @IsOptional()
  @IsString()
  @IsIn(LANGUAGES)
  language?: string;

  @IsOptional()
  @IsString()
  @IsIn(KEY_SCALES)
  keyScale?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  cfgScale?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  topK?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minP?: number;
}
