import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Shot } from '../shot/entities/shot.entity';
import { GenerationTask } from '../shot/entities/generation-task.entity';
import type { TaskStatus } from '@media-creator/shared';
import { SeedanceService } from './seedance.service';
import { ProjectService } from '../project/project.service';
import { StorageService } from '../storage/storage.service';
import * as path from 'path';
import * as fs from 'fs/promises';

const POLL_INTERVAL_MS = 3000;

interface GenerateVideoData {
  shotId: string;
}

@Processor('generation', {
  concurrency: 3,
  lockDuration: 300_000,
  // If a job is stalled (worker crash), re-queue
  stalledInterval: 60_000,
  maxStalledCount: 3,
})
export class GenerationWorker extends WorkerHost {
  private readonly logger = new Logger(GenerationWorker.name);

  constructor(
    @InjectRepository(Shot)
    private readonly shotRepo: Repository<Shot>,
    @InjectRepository(GenerationTask)
    private readonly taskRepo: Repository<GenerationTask>,
    private readonly seedanceService: SeedanceService,
    private readonly config: ConfigService,
    private readonly storageService: StorageService,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
  ) {
    super();
  }

  async process(job: Job<GenerateVideoData>): Promise<void> {
    const { shotId } = job.data;
    this.logger.log(`Processing shot ${shotId} (attempt ${(job.attemptsMade ?? 0) + 1})`);

    const shot = await this.shotRepo.findOne({
      where: { id: shotId },
      relations: ['project', 'generationTask'],
    });
    if (!shot || !shot.generationTask) {
      throw new Error(`Shot ${shotId} or its generation task not found`);
    }

    let task = shot.generationTask;

    // Step 1: Submit to Seedance if no taskId
    let seedanceTaskId = task.taskId || '';
    if (!seedanceTaskId) {
      seedanceTaskId = await this.submitToSeedance(shot, task);
      task.taskId = seedanceTaskId;
      task.status = 'queued';
      task.errorMessage = '';
      await this.taskRepo.save(task);
      this.emitAndRecalculate(shot.projectId, shotId, 'queued', 0);
    } else {
      this.logger.log(`Resuming existing Seedance task: ${seedanceTaskId}`);
    }

    // Step 2: Poll until terminal
    await this.pollUntilTerminal(shot, task, seedanceTaskId, job);
  }

  private async submitToSeedance(shot: Shot, task: GenerationTask): Promise<string> {
    const globalStyle = shot.project?.globalStylePrompt ?? '';
    const cameraKeywords = this.buildCameraKeywords(shot);
    const constraintKeywords = this.buildConstraintKeywords(shot);
    const combinedPrompt = [globalStyle, shot.prompt, cameraKeywords, constraintKeywords]
      .filter(Boolean)
      .join(', ');

    this.logger.log(`Submitting shot ${shot.id}`);

    const { taskId } = await this.seedanceService.submit({
      prompt: combinedPrompt,
      model: shot.model,
      duration: shot.duration,
      aspectRatio: shot.aspectRatio,
      resolution: shot.resolution,
      referenceImages: [shot.characterRef, shot.sceneRef].filter(Boolean) as string[],
    });

    return taskId;
  }

  private async pollUntilTerminal(
    shot: Shot,
    task: GenerationTask,
    seedanceTaskId: string,
    job: Job<GenerateVideoData>,
  ): Promise<void> {
    while (true) {
      await sleep(POLL_INTERVAL_MS);

      const fresh = await this.taskRepo.findOne({ where: { id: task.id } });
      if (!fresh) {
        this.logger.warn(`Task ${task.id} disappeared during poll`);
        return;
      }
      task = fresh;

      let result;
      try {
        result = await this.seedanceService.poll(seedanceTaskId);
      } catch (err: any) {
        this.logger.error(`Poll error for ${seedanceTaskId}: ${err.message}`);
        continue;
      }

      const mappedStatus: TaskStatus =
        result.status === 'running'
          ? 'generating'
          : result.status === 'succeeded'
            ? 'completed'
            : result.status === 'failed'
              ? 'failed'
              : 'generating';

      const progress = result.progress ?? task.progress;

      task.status = mappedStatus;
      task.progress = progress;
      task.errorMessage = result.errorMessage ?? '';

      // Update BullMQ job progress (for event listeners)
      await job.updateProgress(progress);

      if (result.status === 'succeeded') {
        if (!result.videoUrl) {
          task.status = 'failed';
          task.errorMessage = 'Seedance returned success but no video URL';
          await this.taskRepo.save(task);
          this.emitAndRecalculate(shot.projectId, shot.id, 'failed', 100, task.errorMessage);
          return;
        }

        task.videoUrl = result.videoUrl;
        task.progress = 100;
        await this.taskRepo.save(task);
        this.emitAndRecalculate(shot.projectId, shot.id, 'generating', 100);

        try {
          await this.persistVideo(shot, task, result.videoUrl);
          task.status = 'completed';
          await this.taskRepo.save(task);
          this.emitAndRecalculate(shot.projectId, shot.id, 'completed', 100);
        } catch (err: any) {
          this.logger.error(`Download failed for shot ${shot.id}: ${err.message}`);
          task.status = 'failed';
          task.errorMessage = `DOWNLOAD_ERROR: ${err.message}`;
          await this.taskRepo.save(task);
          this.emitAndRecalculate(shot.projectId, shot.id, 'failed', 100, task.errorMessage);
        }
        return;
      }

      if (result.status === 'failed') {
        await this.taskRepo.save(task);
        this.emitAndRecalculate(shot.projectId, shot.id, 'failed', progress, task.errorMessage);
        return;
      }

      // Intermediate status — save and keep polling
      await this.taskRepo.save(task);
      this.emitAndRecalculate(shot.projectId, shot.id, mappedStatus, progress);
    }
  }

  private async persistVideo(shot: Shot, task: GenerationTask, videoUrl: string): Promise<void> {
    const tmpDir = this.config.get<string>('OUTPUT_DIR', './tmp');
    await fs.mkdir(tmpDir, { recursive: true });

    // Download to temp file
    const tmpPath = path.join(tmpDir, `${shot.id}.mp4`);
    await this.seedanceService.downloadAndSave(videoUrl, tmpPath);

    // Extract last frame from temp file
    const frameTmpPath = path.join(tmpDir, `${shot.id}_lastframe.png`);
    try {
      await this.seedanceService.extractLastFrame(tmpPath, frameTmpPath);
    } catch (err: any) {
      this.logger.warn(`Last frame extraction failed for shot ${shot.id}: ${err.message}`);
    }

    // Upload to MinIO
    const objectKey = `projects/${shot.projectId}/shots/${shot.order}.mp4`;
    await this.storageService.uploadFile(tmpPath, objectKey);
    task.localPath = objectKey;

    // Upload last frame if extracted
    try {
      await fs.access(frameTmpPath);
      const frameKey = `projects/${shot.projectId}/shots/${shot.order}_lastframe.png`;
      await this.storageService.uploadFile(frameTmpPath, frameKey);
      task.lastFramePath = frameKey;
    } catch {
      // Frame file doesn't exist, skip
    }
  }

  private emitAndRecalculate(
    projectId: string,
    _shotId: string,
    _status: string,
    _progress: number,
    _errorMessage?: string,
  ): void {
    this.projectService.recalculateStatus(projectId).catch(
      (err: any) => this.logger.warn(`recalculateStatus failed: ${err.message}`),
    );
  }

  private buildCameraKeywords(shot: Shot): string {
    const parts: string[] = [];
    const camMap: Record<string, string> = {
      'extreme-wide': 'extreme wide shot',
      wide: 'wide shot',
      medium: 'medium shot',
      'close-up': 'close-up shot',
      'extreme-close-up': 'extreme close-up shot',
    };
    const angleMap: Record<string, string> = {
      'eye-level': 'eye-level angle',
      low: 'low angle',
      high: 'high angle',
      dutch: 'dutch angle',
      aerial: 'aerial shot',
    };
    const moveMap: Record<string, string> = {
      static: 'static camera',
      pan: 'panning camera movement',
      tilt: 'tilting camera movement',
      dolly: 'dolly camera movement',
      zoom: 'zoom camera movement',
      handheld: 'handheld camera movement',
    };

    if (shot.shotSize) parts.push(camMap[shot.shotSize] ?? shot.shotSize);
    if (shot.angle) parts.push(angleMap[shot.angle] ?? shot.angle);
    if (shot.movement) parts.push(moveMap[shot.movement] ?? shot.movement);

    return parts.join(', ');
  }

  private buildConstraintKeywords(shot: Shot): string {
    const parts: string[] = [];
    if (shot.requiredElements?.length) {
      parts.push(`must include: ${shot.requiredElements.join(', ')}`);
    }
    if (shot.forbiddenElements?.length) {
      parts.push(`avoid: ${shot.forbiddenElements.join(', ')}`);
    }
    return parts.join('. ');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<GenerateVideoData>) {
    this.logger.log(`Job completed for shot ${job.data.shotId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<GenerateVideoData>, error: Error) {
    this.logger.error(`Job failed for shot ${job.data.shotId}: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(_job: Job<GenerateVideoData>, _progress: number) {
    // Progress already handled in poll loop
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
