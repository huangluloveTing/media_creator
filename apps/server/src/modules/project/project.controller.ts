import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { GenerationService } from '../seedance/generation.service';
import { FFmpegService } from '../ffmpeg/ffmpeg.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly generationService: GenerationService,
    private readonly ffmpegService: FFmpegService,
  ) {}

  @Post()
  async create(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @Get()
  async findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Get(':id/full')
  async findFull(@Param('id') id: string) {
    return this.projectService.findFull(id);
  }

  @Get(':id/shots')
  async getShotsWithStatus(@Param('id') id: string) {
    return this.generationService.getShotsWithStatus(id);
  }

  @Post(':id/generate-all')
  async generateAll(@Param('id') id: string) {
    await this.generationService.generateAllShots(id);
    return { ok: true };
  }

  @Post(':id/merge')
  async merge(@Param('id') id: string) {
    const project = await this.projectService.findFull(id);

    if (!project.shots || project.shots.length === 0) {
      throw new BadRequestException('No shots to merge');
    }

    const issues = await this.ffmpegService.validatePrerequisites(project.shots);
    if (issues.length > 0) {
      throw new BadRequestException({ message: 'Not all shots completed', issues });
    }

    await this.projectService.updateStatus(id, 'merging');

    try {
      const outputPath = await this.ffmpegService.merge({
        shots: project.shots,
        edges: project.edges,
        bgmPath: project.bgmPath,
        bgmVolume: project.bgmVolume ?? 0.3,
        originalVolume: project.originalVolume ?? 1.0,
        outputPath: `${project.outputDir ?? './output'}/${project.title}_final.mp4`,
        resolution: project.resolution ?? '1920x1080',
        fps: project.fps ?? 24,
      });

      await this.projectService.updateStatus(id, 'completed');
      return { ok: true, outputPath };
    } catch (error: any) {
      await this.projectService.updateStatus(id, 'ready_to_merge');
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.projectService.remove(id);
  }
}
