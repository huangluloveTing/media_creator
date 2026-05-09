import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateEdgeDto {
  @IsOptional()
  @IsString()
  transitionType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  transitionDuration?: number;

  @IsOptional()
  @IsString()
  subtitleText?: string;
}
