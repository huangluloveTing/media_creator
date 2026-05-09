import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { SeedanceModule } from '../seedance/seedance.module';
import { FFmpegModule } from '../ffmpeg/ffmpeg.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), forwardRef(() => SeedanceModule), FFmpegModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
