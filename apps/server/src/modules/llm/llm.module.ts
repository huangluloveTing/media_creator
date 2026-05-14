import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { SettingsModule } from '../settings/settings.module';
import { StoryboardDraft } from './entities/storyboard-draft.entity';
import { StoryboardService } from './storyboard.service';
import { ProjectModule } from '../project/project.module';
import { Shot } from '../shot/entities/shot.entity';
import { Edge } from '../shot/entities/edge.entity';

@Module({
  imports: [
    SettingsModule,
    forwardRef(() => ProjectModule),
    TypeOrmModule.forFeature([StoryboardDraft, Shot, Edge]),
  ],
  controllers: [LlmController],
  providers: [LlmService, StoryboardService],
  exports: [StoryboardService],
})
export class LlmModule {}
