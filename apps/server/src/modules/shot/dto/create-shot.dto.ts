import { IsString, IsOptional, IsInt, IsNumber, IsArray, Min } from 'class-validator';

export class CreateShotDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  shotSize?: string;

  @IsOptional()
  @IsString()
  angle?: string;

  @IsOptional()
  @IsString()
  movement?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredElements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  forbiddenElements?: string[];

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @IsOptional()
  @IsString()
  resolution?: string;
}
