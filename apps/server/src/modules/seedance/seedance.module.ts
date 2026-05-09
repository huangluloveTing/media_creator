import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedanceService } from './seedance.service';
import { GenerationService } from './generation.service';
import { Shot } from '../shot/entities/shot.entity';
import { GenerationTask } from '../shot/entities/generation-task.entity';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shot, GenerationTask]),
    forwardRef(() => ProjectModule),
  ],
  providers: [SeedanceService, GenerationService],
  exports: [SeedanceService, GenerationService],
})
export class SeedanceModule {}
