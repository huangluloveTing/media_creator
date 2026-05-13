import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Shot } from '../shot/entities/shot.entity';
import { GenerationTask } from '../shot/entities/generation-task.entity';
import { ProjectService } from '../project/project.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class GenerationService implements OnModuleInit {
  private readonly logger = new Logger(GenerationService.name);
  private apiKeyValid = false;

  constructor(
    @InjectRepository(Shot)
    private readonly shotRepo: Repository<Shot>,
    @InjectRepository(GenerationTask)
    private readonly taskRepo: Repository<GenerationTask>,
    @InjectQueue('generation')
    private readonly generationQueue: Queue,
    private readonly projectService: ProjectService,
    private readonly settings: SettingsService,
  ) {
    this.validateApiKey();
  }

  async onModuleInit(): Promise<void> {
    // Purge stale jobs from Redis
    await this.generationQueue.obliterate({ force: true });
    this.logger.log('Generation queue initialised');

    // Reset orphaned DB tasks
    const res = await this.taskRepo.query(
      `UPDATE generation_tasks SET status = 'queued' WHERE status = 'generating' RETURNING id`,
    );
    if (res.length) {
      this.logger.log(`Reset ${res.length} orphaned task(s) from previous run`);
    }
  }

  private async validateApiKey(): Promise<void> {
    const apiKey =
      (await this.settings.getRaw('seedance.apiKey')) ||
      process.env['SEEDANCE_API_KEY'] ||
      '';
    this.apiKeyValid = !!apiKey;
    if (!this.apiKeyValid) {
      this.logger.warn('Seedance API Key not configured — 视频生成将失败，请在设置页面配置 API Key');
    } else {
      this.logger.log('Seedance API Key 已配置');
    }
  }

  async generateShot(shotId: string): Promise<GenerationTask> {
    if (!this.apiKeyValid) {
      throw new Error('Seedance API Key 未配置，请在设置页面配置后再试');
    }

    const shot = await this.shotRepo.findOne({
      where: { id: shotId },
      relations: ['generationTask'],
    });
    if (!shot) throw new Error(`Shot ${shotId} not found`);

    const existing = shot.generationTask;
    if (existing && (existing.status === 'queued' || existing.status === 'generating')) {
      throw new Error(`Shot ${shotId} is already generating`);
    }

    const task = existing
      ? this.taskRepo.create({
          ...existing,
          taskId: '',
          status: 'queued',
          progress: 0,
          errorMessage: '',
          videoUrl: '',
          localPath: '',
          lastFramePath: '',
        })
      : this.taskRepo.create({ shotId, status: 'queued', progress: 0 });

    const saved = await this.taskRepo.save(task);
    await this.projectService.recalculateStatus(shot.projectId);

    // Remove any existing job for this shot (handles retry of failed job)
    const existingJobId = `generate-video-${shotId}`;
    await this.generationQueue.remove(existingJobId).catch(() => {});

    // Enqueue BullMQ job
    await this.generationQueue.add(
      'generate-video',
      { shotId },
      {
        jobId: existingJobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: { age: 3600, count: 10 },
      },
    );

    return saved;
  }

  async generateAllShots(projectId: string): Promise<void> {
    const shots = await this.shotRepo.find({
      where: { projectId },
      order: { order: 'ASC' },
      relations: ['generationTask'],
    });

    const pending = shots.filter(
      (s) =>
        !s.generationTask ||
        s.generationTask.status === 'draft' ||
        s.generationTask.status === 'failed',
    );

    for (const shot of pending) {
      try {
        await this.generateShot(shot.id);
      } catch (err: any) {
        this.logger.warn(`Skipping ${shot.id}: ${err.message}`);
      }
    }
  }

  async getShotsWithStatus(projectId: string): Promise<Shot[]> {
    return this.shotRepo.find({
      where: { projectId },
      order: { order: 'ASC' },
      relations: ['generationTask'],
    });
  }
}
