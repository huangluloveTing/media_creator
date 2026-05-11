import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.getAll();
  }

  @Get(':provider')
  findByProvider(@Param('provider') provider: string) {
    return this.settingsService.getByProvider(provider);
  }

  @Put()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateBatch(dto.items);
  }
}
