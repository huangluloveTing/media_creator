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
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShotService } from './shot.service';
import { GenerationService } from '../seedance/generation.service';
import { GenerationTask } from './entities/generation-task.entity';
import { StorageService } from '../storage/storage.service';
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
    private readonly storageService: StorageService,
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
  async getShotVideo(@Param('id') shotId: string) {
    const task = await this.taskRepo.findOne({ where: { shotId } });
    if (!task?.localPath) {
      throw new NotFoundException('Video not ready for this shot');
    }
    const url = await this.storageService.getPresignedUrl(task.localPath);
    return { url };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.shotService.remove(id);
  }
}
