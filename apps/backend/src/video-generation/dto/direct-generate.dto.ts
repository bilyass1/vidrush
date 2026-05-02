import { IsString, IsNumber, MinLength, MaxLength, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { VIDEO_GENRES, VIDEO_ASPECT_RATIOS, VIDEO_MARKETS } from './generate-video.dto';

export class DirectGenerateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  idea!: string;

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
  @Min(2)
  @Max(30)
  duration!: number; // seconds — keep short for direct generation
}
