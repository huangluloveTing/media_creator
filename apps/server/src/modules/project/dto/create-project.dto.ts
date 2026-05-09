import { IsString, IsOptional, IsInt, IsNumber, Min, Max } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  fps?: number;

  @IsOptional()
  @IsString()
  defaultTransitionType?: string;

  @IsOptional()
  @IsNumber()
  defaultTransitionDuration?: number;

  @IsOptional()
  @IsString()
  globalStylePrompt?: string;

  @IsOptional()
  @IsString()
  outputDir?: string;
}
