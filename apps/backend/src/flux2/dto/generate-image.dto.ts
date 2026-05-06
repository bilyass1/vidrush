import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsString()
  referenceImagePath?: string;

  @IsOptional()
  @IsNumber()
  @Min(512)
  @Max(2048)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(512)
  @Max(2048)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  steps?: number;

  @IsOptional()
  @IsNumber()
  guidance?: number;

  @IsOptional()
  @IsNumber()
  seed?: number;

  @IsOptional()
  @IsBoolean()
  enableTurbo?: boolean;
}
