import { IsString, IsNumber, MinLength, MaxLength, Min, Max, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { VIDEO_GENRES, VIDEO_ASPECT_RATIOS, VIDEO_MARKETS } from './generate-video.dto';

export class DirectGenerateDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  idea!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsIn(VIDEO_GENRES)
  genre!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsIn(VIDEO_ASPECT_RATIOS)
  aspectRatio!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsIn(VIDEO_MARKETS)
  market!: string;

  @Transform(({ value }) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @Min(2)
  @Max(30)
  duration!: number; // seconds — keep short for direct generation

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  disable_i2v?: boolean;
}
