import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import type { ProjectStatus } from '@media-creator/shared';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Shot } from '../shot/entities/shot.entity';
import { Edge } from '../shot/entities/edge.entity';
import { GenerationTask } from '../shot/entities/generation-task.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create({
      title: dto.title,
      resolution: dto.resolution ?? '1920x1080',
      fps: dto.fps ?? 24,
      defaultTransitionType: dto.defaultTransitionType ?? 'dissolve',
      defaultTransitionDuration: dto.defaultTransitionDuration ?? 0.5,
      globalStylePrompt: dto.globalStylePrompt ?? '',
      outputDir: dto.outputDir ?? './output',
      status: 'draft',
    });
    return this.projectRepo.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepo.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async findFull(id: string): Promise<any> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    const shots = await this.projectRepo.manager.find(Shot, {
      where: { projectId: id },
      order: { order: 'ASC' },
      relations: ['generationTask'],
    });

    const edges = await this.projectRepo.manager.find(Edge, {
      where: { projectId: id },
      order: { position: 'ASC' },
    });

    return {
      ...project,
      shots: shots.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        order: s.order,
        prompt: s.prompt,
        shotSize: s.shotSize,
        angle: s.angle,
        movement: s.movement,
        duration: s.duration,
        requiredElements: s.requiredElements,
        forbiddenElements: s.forbiddenElements,
        characterRef: s.characterRef,
        sceneRef: s.sceneRef,
        model: s.model,
        aspectRatio: s.aspectRatio,
        resolution: s.resolution,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        generation: s.generationTask
          ? {
              id: s.generationTask.id,
              taskId: s.generationTask.taskId,
              status: s.generationTask.status,
              progress: s.generationTask.progress,
              videoUrl: s.generationTask.videoUrl,
              localPath: s.generationTask.localPath,
              lastFramePath: s.generationTask.lastFramePath,
              errorMessage: s.generationTask.errorMessage,
            }
          : null,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        sourceShotId: e.sourceShotId,
        targetShotId: e.targetShotId,
        transitionType: e.transitionType,
        transitionDuration: e.transitionDuration,
        subtitleText: e.subtitleText,
        position: e.position,
      })),
    };
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepo.remove(project);
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    const project = await this.findOne(id);
    project.status = status;
    return this.projectRepo.save(project);
  }

  async recalculateStatus(id: string): Promise<Project> {
    const project = await this.findOne(id);

    const generationTasks = await this.projectRepo.manager.find(GenerationTask, {
      where: {
        shot: { projectId: id },
      },
    });

    if (generationTasks.length === 0) {
      project.status = 'draft';
    } else if (generationTasks.some((t) => t.status === 'generating' || t.status === 'queued')) {
      project.status = 'generating';
    } else if (generationTasks.every((t) => t.status === 'completed')) {
      project.status = 'ready_to_merge';
    } else if (generationTasks.some((t) => t.status === 'failed')) {
      // If some failed but none are actively generating, keep as draft or ready_to_merge
      project.status = generationTasks.every((t) =>
        t.status === 'completed' || t.status === 'failed'
      ) ? 'ready_to_merge' : 'draft';
    } else {
      project.status = 'draft';
    }

    return this.projectRepo.save(project);
  }
}
