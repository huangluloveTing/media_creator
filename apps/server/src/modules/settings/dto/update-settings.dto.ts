import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SettingItem {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class UpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItem)
  items: SettingItem[];
}
