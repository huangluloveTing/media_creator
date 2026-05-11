import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shot } from '../shot/entities/shot.entity';
import { GenerationTask } from '../shot/entities/generation-task.entity';
import type { TaskStatus } from '@media-creator/shared';
import { SeedanceService } from './seedance.service';
import { ProjectService } from '../project/project.service';
import * as path from 'path';

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);
  private readonly activePolls = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    @InjectRepository(Shot)
    private readonly shotRepo: Repository<Shot>,
    @InjectRepository(GenerationTask)
    private readonly taskRepo: Repository<GenerationTask>,
    private readonly seedanceService: SeedanceService,
    private readonly projectService: ProjectService,
    private readonly config: ConfigService,
  ) {}

  async generateShot(shotId: string): Promise<GenerationTask> {
    const shot = await this.shotRepo.findOne({
      where: { id: shotId },
      relations: ['project', 'generationTask'],
    });
    if (!shot) throw new Error(`Shot ${shotId} not found`);

    const existing = shot.generationTask;
    if (existing && (existing.status === 'queued' || existing.status === 'generating')) {
      throw new Error(`Shot ${shotId} is already generating`);
    }

    // Build combined prompt
    const globalStyle = shot.project?.globalStylePrompt ?? '';
    const cameraKeywords = this.buildCameraKeywords(shot);
    const constraintKeywords = this.buildConstraintKeywords(shot);
    const combinedPrompt = [globalStyle, shot.prompt, cameraKeywords, constraintKeywords]
      .filter(Boolean)
      .join(', ');

    // Submit to Seedance
    const { taskId } = await this.seedanceService.submit({
      prompt: combinedPrompt,
      model: shot.model,
      duration: shot.duration,
      aspectRatio: shot.aspectRatio,
      resolution: shot.resolution,
      referenceImages: [shot.characterRef, shot.sceneRef].filter(Boolean) as string[],
    });

    // Create or update generation task
    const task = existing
      ? this.taskRepo.create({ ...existing, taskId, status: 'queued', progress: 0, errorMessage: '' })
      : this.taskRepo.create({ shotId, taskId, status: 'queued', progress: 0 });

    const saved = await this.taskRepo.save(task);

    // Start polling
    this.startPolling(saved.id, taskId, shotId, shot.projectId);

    // Update project status
    await this.projectService.recalculateStatus(shot.projectId);

    return saved;
  }

  async generateAllShots(projectId: string, concurrency = 3): Promise<void> {
    const shots = await this.shotRepo.find({
      where: { projectId },
      order: { order: 'ASC' },
      relations: ['generationTask'],
    });

    // Filter to only shots ready for generation
    const pending = shots.filter(
      (s) =>
        !s.generationTask ||
        s.generationTask.status === 'draft' ||
        s.generationTask.status === 'failed',
    );

    // Submit with concurrency limit
    for (let i = 0; i < pending.length; i += concurrency) {
      const batch = pending.slice(i, i + concurrency);
      await Promise.allSettled(batch.map((s) => this.generateShot(s.id)));
    }
  }

  private startPolling(
    taskDbId: string,
    seedanceTaskId: string,
    shotId: string,
    projectId: string,
  ): void {
    const interval = setInterval(async () => {
      try {
        const result = await this.seedanceService.poll(seedanceTaskId);

        const task = await this.taskRepo.findOne({ where: { id: taskDbId } });
        if (!task) {
          this.stopPolling(taskDbId);
          return;
        }

        const isTerminal = result.status === 'succeeded' || result.status === 'failed';
        const mappedStatus: TaskStatus =
          result.status === 'running' ? 'generating' :
          result.status === 'succeeded' ? 'completed' :
          result.status === 'failed' ? 'failed' : 'queued';
        task.status = mappedStatus;
        task.progress = result.progress ?? task.progress;
        task.errorMessage = result.errorMessage ?? '';

        if (isTerminal) {
          this.stopPolling(taskDbId);
        }

        if (result.status === 'succeeded' && result.videoUrl) {
          task.videoUrl = result.videoUrl;
          task.progress = 100;

          // Download video
          const shot = await this.shotRepo.findOne({ where: { id: shotId } });
          if (shot) {
            const outputDir = this.config.get<string>('OUTPUT_DIR', './output');
            const shotPath = path.join(outputDir, projectId, 'shots', `${shot.order}.mp4`);
            try {
              await this.seedanceService.downloadAndSave(result.videoUrl, shotPath);
              task.localPath = shotPath;

              // Extract last frame
              const framePath = path.join(
                outputDir,
                projectId,
                'shots',
                `${shot.order}_lastframe.png`,
              );
              await this.seedanceService.extractLastFrame(shotPath, framePath);
              task.lastFramePath = framePath;
            } catch (downloadError: any) {
              this.logger.error(`Download failed for ${shotId}: ${downloadError.message}`);
              task.status = 'failed';
              task.errorMessage = `Download failed: ${downloadError.message}`;
            }
          }
        }

        if (result.status === 'succeeded' && !result.videoUrl) {
          task.status = 'failed';
          task.errorMessage = 'Seedance returned success but no video URL';
        }

        await this.taskRepo.save(task);
        await this.projectService.recalculateStatus(projectId);
      } catch (pollError: any) {
        this.logger.error(`Poll error for ${seedanceTaskId}: ${pollError.message}`);
      }
    }, 3000);

    this.activePolls.set(taskDbId, interval);
  }

  private stopPolling(taskDbId: string): void {
    const interval = this.activePolls.get(taskDbId);
    if (interval) {
      clearInterval(interval);
      this.activePolls.delete(taskDbId);
    }
  }

  private buildCameraKeywords(shot: Shot): string {
    const parts: string[] = [];
    const camMap: Record<string, string> = {
      'extreme-wide': 'extreme wide shot',
      'wide': 'wide shot',
      'medium': 'medium shot',
      'close-up': 'close-up shot',
      'extreme-close-up': 'extreme close-up shot',
    };
    const angleMap: Record<string, string> = {
      'eye-level': 'eye-level angle',
      'low': 'low angle',
      'high': 'high angle',
      'dutch': 'dutch angle',
      'aerial': 'aerial shot',
    };
    const moveMap: Record<string, string> = {
      'static': 'static camera',
      'pan': 'panning camera movement',
      'tilt': 'tilting camera movement',
      'dolly': 'dolly camera movement',
      'zoom': 'zoom camera movement',
      'handheld': 'handheld camera movement',
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

  async getShotsWithStatus(projectId: string): Promise<Shot[]> {
    return this.shotRepo.find({
      where: { projectId },
      order: { order: 'ASC' },
      relations: ['generationTask'],
    });
  }
}
