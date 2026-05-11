import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

export interface SeedanceSubmitParams {
  prompt: string;
  model?: string;
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
  referenceImages?: string[];
}

export interface SeedanceTaskResult {
  taskId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress?: number;
  videoUrl?: string;
  errorMessage?: string;
}

@Injectable()
export class SeedanceService {
  private readonly logger = new Logger(SeedanceService.name);
  private baseURL: string;

  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
  ) {
    this.baseURL = config.get<string>('SEEDANCE_API_URL', 'https://ark.cn-beijing.volces.com');
  }

  private async resolveApiKey(): Promise<string> {
    const dbKey = await this.settings.getRaw('seedance.apiKey');
    if (dbKey) return dbKey;
    return this.config.get<string>('SEEDANCE_API_KEY', '');
  }

  private async resolveBaseUrl(): Promise<string> {
    const dbUrl = await this.settings.getRaw('seedance.apiUrl');
    if (dbUrl) return dbUrl;
    return this.baseURL;
  }

  async submit(params: SeedanceSubmitParams): Promise<{ taskId: string }> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      throw new Error('Seedance API key not configured — 请在设置页面配置 Seedance API Key');
    }

    const baseURL = await this.resolveBaseUrl();

    const payload = {
      model: params.model ?? 'seedance-2.0',
      content: [
        {
          type: 'text',
          text: params.prompt,
        },
        ...(params.referenceImages ?? []).map((url) => ({
          type: 'image_url',
          image_url: { url },
        })),
      ],
      parameters: {
        duration: params.duration ?? 5,
        aspect_ratio: params.aspectRatio ?? '16:9',
        resolution: params.resolution ?? '1080p',
      },
    };

    this.logger.log(`Submitting Seedance task: ${params.prompt.slice(0, 80)}...`);

    try {
      const res = await axios.post(`${baseURL}/api/v3/contents/generations/tasks`, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30_000,
      });
      const taskId = res.data?.id;
      if (!taskId) throw new Error('No task ID in Seedance response');
      return { taskId };
    } catch (error: any) {
      const msg = error.response?.data?.error?.message ?? error.message;
      this.logger.error(`Seedance submit failed: ${msg}`);
      throw new Error(`Seedance submit failed: ${msg}`);
    }
  }

  async poll(taskId: string): Promise<SeedanceTaskResult> {
    try {
      const apiKey = await this.resolveApiKey();
      const baseURL = await this.resolveBaseUrl();
      const res = await axios.get(`${baseURL}/api/v3/contents/generations/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30_000,
      });
      const data = res.data;

      return {
        taskId,
        status: data.status,
        progress: data.progress,
        videoUrl: data.status === 'succeeded' ? data.content?.video_url : undefined,
        errorMessage: data.status === 'failed' ? data.error?.message : undefined,
      };
    } catch (error: any) {
      this.logger.error(`Seedance poll failed for ${taskId}: ${error.message}`);
      return {
        taskId,
        status: 'failed',
        errorMessage: `Poll error: ${error.message}`,
      };
    }
  }

  async downloadAndSave(videoUrl: string, localPath: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    await fs.mkdir(path.dirname(localPath), { recursive: true });

    this.logger.log(`Downloading video to ${localPath}...`);

    const res = await axios.get(videoUrl, {
      responseType: 'stream',
      timeout: 120_000,
    });

    const writer = (await import('fs')).createWriteStream(localPath);
    res.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    this.logger.log(`Downloaded: ${localPath}`);
  }

  async extractLastFrame(videoPath: string, outputPath: string): Promise<string> {
    const { spawn } = await import('child_process');
    const path = await import('path');
    const fs = await import('fs/promises');

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', [
        '-sseof', '-1',
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        outputPath,
      ]);

      proc.on('close', (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`ffmpeg last-frame extraction failed with code ${code}`));
      });

      proc.stderr.on('data', () => {}); // suppress ffmpeg log
    });
  }
}
