import { IsInt, Min } from 'class-validator';

export class ReorderShotDto {
  @IsInt()
  @Min(0)
  newOrder: number;
}
