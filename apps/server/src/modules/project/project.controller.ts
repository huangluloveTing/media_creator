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
  NotFoundException,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { GenerationService } from '../seedance/generation.service';
import { FFmpegService } from '../ffmpeg/ffmpeg.service';
import { StorageService } from '../storage/storage.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly generationService: GenerationService,
    private readonly ffmpegService: FFmpegService,
    private readonly storageService: StorageService,
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
    const mergeConfig = await this.projectService.findMergeData(id);

    if (!mergeConfig.shots || mergeConfig.shots.length === 0) {
      throw new BadRequestException('No shots to merge');
    }

    const issues = await this.ffmpegService.validatePrerequisites(mergeConfig.shots);
    if (issues.length > 0) {
      throw new BadRequestException({ message: 'Not all shots completed', issues });
    }

    await this.projectService.updateStatus(id, 'merging');

    // Use a temp file for FFmpeg output
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tmpDir, { recursive: true });
    const tmpOutput = path.join(tmpDir, `merge_${uuid()}.mp4`);
    mergeConfig.outputPath = tmpOutput;

    try {
      await this.ffmpegService.merge(mergeConfig);

      // Upload to MinIO
      const objectKey = `projects/${id}/final.mp4`;
      await this.storageService.uploadFile(tmpOutput, objectKey);

      // Update project with final video key
      await this.projectService.updateFinalVideoKey(id, objectKey);

      await this.projectService.updateStatus(id, 'completed');

      const presignedUrl = await this.storageService.getPresignedUrl(objectKey);
      return { ok: true, url: presignedUrl };
    } catch (error: any) {
      // Clean up temp file on error
      await fs.unlink(tmpOutput).catch(() => {});
      await this.projectService.updateStatus(id, 'ready_to_merge');
      throw error;
    }
  }

  @Get(':id/final-video')
  async getFinalVideo(@Param('id') id: string) {
    const project = await this.projectService.findOne(id);
    if (!project.finalVideoKey) {
      throw new NotFoundException('Final video not ready for this project');
    }
    const url = await this.storageService.getPresignedUrl(project.finalVideoKey);
    return { url };
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
