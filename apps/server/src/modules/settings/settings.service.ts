import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/settings.entity';

function maskValue(value: string): string {
  if (!value || value.length <= 8) return '****';
  return value.slice(0, 4) + '****' + value.slice(-4);
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
  ) {}

  async getAll(): Promise<Setting[]> {
    const settings = await this.repo.find({ order: { provider: 'ASC', key: 'ASC' } });
    return settings.map((s) => ({ ...s, value: maskValue(s.value) }));
  }

  async getByProvider(provider: string): Promise<Setting[]> {
    const settings = await this.repo.find({ where: { provider }, order: { key: 'ASC' } });
    return settings.map((s) => ({ ...s, value: maskValue(s.value) }));
  }

  async getRaw(key: string): Promise<string | null> {
    const setting = await this.repo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async updateBatch(items: { key: string; value: string }[]): Promise<Setting[]> {
    const results: Setting[] = [];
    for (const item of items) {
      let setting = await this.repo.findOne({ where: { key: item.key } });
      if (!setting) {
        setting = this.repo.create({ key: item.key, value: item.value });
      } else {
        setting.value = item.value;
      }
      results.push(await this.repo.save(setting));
    }
    return results.map((s) => ({ ...s, value: maskValue(s.value) }));
  }

  async getEffectiveValue(key: string, envKey: string, fallback: string): Promise<string> {
    const dbValue = await this.getRaw(key);
    if (dbValue) return dbValue;
    return process.env[envKey] ?? fallback;
  }
}
