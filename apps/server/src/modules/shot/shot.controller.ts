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
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShotService } from './shot.service';
import { GenerationService } from '../seedance/generation.service';
import { GenerationTask } from './entities/generation-task.entity';
import { CreateShotDto } from './dto/create-shot.dto';
import { UpdateShotDto } from './dto/update-shot.dto';
import { ReorderShotDto } from './dto/reorder-shot.dto';

@Controller('shots')
export class ShotController {
  constructor(
    private readonly shotService: ShotService,
    private readonly generationService: GenerationService,
    @InjectRepository(GenerationTask)
    private readonly taskRepo: Repository<GenerationTask>,
  ) {}

  @Post()
  async create(@Body() dto: CreateShotDto) {
    return this.shotService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shotService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateShotDto) {
    return this.shotService.update(id, dto);
  }

  @Put(':id/reorder')
  async reorder(@Param('id') id: string, @Body() dto: ReorderShotDto) {
    await this.shotService.reorder(id, dto);
    return { ok: true };
  }

  @Post(':id/generate')
  async generate(@Param('id') id: string) {
    return this.generationService.generateShot(id);
  }

  @Get(':id/video')
  async streamVideo(@Param('id') shotId: string, @Res() res: Response) {
    const task = await this.taskRepo.findOne({ where: { shotId } });
    if (!task?.localPath) {
      throw new NotFoundException('Video not ready for this shot');
    }
    const absolutePath = path.resolve(task.localPath);
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('Video file missing on disk');
    }
    res.setHeader('Content-Type', 'video/mp4');
    res.sendFile(absolutePath);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.shotService.remove(id);
  }
}
