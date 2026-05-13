import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shot } from './entities/shot.entity';
import { Edge } from './entities/edge.entity';
import { GenerationTask } from './entities/generation-task.entity';
import { ShotController } from './shot.controller';
import { EdgeController } from './edge.controller';
import { ShotService } from './shot.service';
import { SeedanceModule } from '../seedance/seedance.module';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shot, Edge, GenerationTask]), SeedanceModule, ProjectModule],
  controllers: [ShotController, EdgeController],
  providers: [ShotService],
  exports: [ShotService],
})
export class ShotModule {}
