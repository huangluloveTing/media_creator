import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ShotService } from './shot.service';
import { UpdateEdgeDto } from './dto/update-edge.dto';

@Controller('edges')
export class EdgeController {
  constructor(private readonly shotService: ShotService) {}

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEdgeDto) {
    return this.shotService.updateEdge(id, dto);
  }
}
