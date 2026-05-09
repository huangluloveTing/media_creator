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
} from '@nestjs/common';
import { ShotService } from './shot.service';
import { GenerationService } from '../seedance/generation.service';
import { CreateShotDto } from './dto/create-shot.dto';
import { UpdateShotDto } from './dto/update-shot.dto';
import { ReorderShotDto } from './dto/reorder-shot.dto';

@Controller('shots')
export class ShotController {
  constructor(
    private readonly shotService: ShotService,
    private readonly generationService: GenerationService,
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.shotService.remove(id);
  }
}
