import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Shot } from './entities/shot.entity';
import { Edge } from './entities/edge.entity';
import { GenerationTask } from './entities/generation-task.entity';
import { CreateShotDto } from './dto/create-shot.dto';
import { UpdateShotDto } from './dto/update-shot.dto';
import { UpdateEdgeDto } from './dto/update-edge.dto';
import { ReorderShotDto } from './dto/reorder-shot.dto';
import { ProjectService } from '../project/project.service';

@Injectable()
export class ShotService {
  constructor(
    @InjectRepository(Shot)
    private readonly shotRepo: Repository<Shot>,
    @InjectRepository(Edge)
    private readonly edgeRepo: Repository<Edge>,
    @InjectRepository(GenerationTask)
    private readonly taskRepo: Repository<GenerationTask>,
    private readonly projectService: ProjectService,
  ) {}

  async create(dto: CreateShotDto): Promise<Shot> {
    await this.projectService.findOne(dto.projectId);

    return this.shotRepo.manager.transaction(async (manager) => {
      const shotRepo = manager.getRepository(Shot);

      const maxOrder = await this.getMaxOrderTx(manager, dto.projectId);
      const order = dto.order ?? maxOrder + 1;

      await shotRepo
        .createQueryBuilder()
        .update(Shot)
        .set({ order: () => '"order" + 1' })
        .where('projectId = :projectId AND "order" >= :order', {
          projectId: dto.projectId,
          order,
        })
        .execute();

      const shot = shotRepo.create({
        projectId: dto.projectId,
        order,
        prompt: dto.prompt ?? '',
        shotSize: (dto.shotSize as Shot['shotSize']) ?? 'medium',
        angle: (dto.angle as Shot['angle']) ?? 'eye-level',
        movement: (dto.movement as Shot['movement']) ?? 'static',
        duration: dto.duration ?? 5,
        requiredElements: dto.requiredElements ?? [],
        forbiddenElements: dto.forbiddenElements ?? [],
        model: (dto.model as Shot['model']) ?? 'seedance-2.0',
        aspectRatio: dto.aspectRatio ?? '16:9',
        resolution: dto.resolution ?? '1080p',
      });
      const saved = await shotRepo.save(shot);

      await this.insertShotEdges(manager, dto.projectId, saved.id, order);

      return saved;
    });
  }

  async findAllByProject(projectId: string): Promise<Shot[]> {
    return this.shotRepo.find({
      where: { projectId },
      order: { order: 'ASC' },
      relations: ['generationTask'],
    });
  }

  async findOne(id: string): Promise<Shot> {
    const shot = await this.shotRepo.findOne({
      where: { id },
      relations: ['generationTask'],
    });
    if (!shot) throw new NotFoundException(`Shot ${id} not found`);
    return shot;
  }

  async update(id: string, dto: UpdateShotDto): Promise<Shot> {
    const shot = await this.findOne(id);
    Object.assign(shot, dto);
    return this.shotRepo.save(shot);
  }

  async remove(id: string): Promise<void> {
    const shot = await this.findOne(id);

    await this.shotRepo.manager.transaction(async (manager) => {
      const shotRepo = manager.getRepository(Shot);
      const edgeRepo = manager.getRepository(Edge);

      const incomingEdge = await edgeRepo.findOne({
        where: { targetShotId: id },
      });
      const outgoingEdge = await edgeRepo.findOne({
        where: { sourceShotId: id },
      });

      // Reconnect upstream → downstream
      if (incomingEdge && outgoingEdge) {
        incomingEdge.targetShotId = outgoingEdge.targetShotId ?? null;
        incomingEdge.position = outgoingEdge.position;
        await edgeRepo.save(incomingEdge);
        await edgeRepo.remove(outgoingEdge);
      } else if (incomingEdge) {
        incomingEdge.targetShotId = outgoingEdge?.targetShotId ?? null;
        await edgeRepo.save(incomingEdge);
      } else if (outgoingEdge) {
        outgoingEdge.sourceShotId = null;
        outgoingEdge.position = 0;
        await edgeRepo.save(outgoingEdge);
      }

      await shotRepo
        .createQueryBuilder()
        .update(Shot)
        .set({ order: () => '"order" - 1' })
        .where('projectId = :projectId AND "order" > :order', {
          projectId: shot.projectId,
          order: shot.order,
        })
        .execute();

      await shotRepo.remove(shot);
    });
  }

  async reorder(id: string, dto: ReorderShotDto): Promise<void> {
    const shot = await this.findOne(id);
    const oldOrder = shot.order;
    const newOrder = dto.newOrder;

    if (oldOrder === newOrder) return;

    const maxOrder = await this.getMaxOrder(shot.projectId);
    if (newOrder < 0 || newOrder > maxOrder) {
      throw new BadRequestException(`Invalid order: ${newOrder}`);
    }

    await this.shotRepo.manager.transaction(async (manager) => {
      const shotRepo = manager.getRepository(Shot);

      if (newOrder < oldOrder) {
        await shotRepo
          .createQueryBuilder()
          .update(Shot)
          .set({ order: () => '"order" + 1' })
          .where('projectId = :pid AND "order" >= :newOrder AND "order" < :oldOrder', {
            pid: shot.projectId,
            newOrder,
            oldOrder,
          })
          .execute();
      } else {
        await shotRepo
          .createQueryBuilder()
          .update(Shot)
          .set({ order: () => '"order" - 1' })
          .where('projectId = :pid AND "order" > :oldOrder AND "order" <= :newOrder', {
            pid: shot.projectId,
            oldOrder,
            newOrder,
          })
          .execute();
      }

      shot.order = newOrder;
      await shotRepo.save(shot);

      await this.rebuildEdgePositions(shot.projectId, manager);
    });
  }

  async getShotsWithStatus(projectId: string): Promise<Shot[]> {
    return this.findAllByProject(projectId);
  }

  // -- Edge management --

  async updateEdge(edgeId: string, dto: UpdateEdgeDto): Promise<Edge> {
    const edge = await this.edgeRepo.findOne({ where: { id: edgeId } });
    if (!edge) throw new NotFoundException(`Edge ${edgeId} not found`);
    Object.assign(edge, dto);
    return this.edgeRepo.save(edge);
  }

  async findAllEdges(projectId: string): Promise<Edge[]> {
    return this.edgeRepo.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
  }

  // -- Private helpers --

  private async getMaxOrderTx(manager: EntityManager, projectId: string): Promise<number> {
    const result = await manager
      .createQueryBuilder(Shot, 'shot')
      .select('COALESCE(MAX(shot.order), -1)', 'max')
      .where('shot.projectId = :projectId', { projectId })
      .getRawOne();
    return result?.max ?? -1;
  }

  private async getMaxOrder(projectId: string): Promise<number> {
    const result = await this.shotRepo
      .createQueryBuilder('shot')
      .select('COALESCE(MAX(shot.order), -1)', 'max')
      .where('shot.projectId = :projectId', { projectId })
      .getRawOne();
    return result?.max ?? -1;
  }

  private async makeEdge(
    projectId: string,
    sourceShotId: string | null,
    targetShotId: string | null,
    position: number,
    manager?: EntityManager,
  ): Promise<Edge> {
    const repo = manager?.getRepository(Edge) ?? this.edgeRepo;
    return repo.save(
      repo.create({
        projectId,
        sourceShotId,
        targetShotId,
        position,
      }),
    );
  }

  private async insertShotEdges(
    manager: EntityManager,
    projectId: string,
    newShotId: string,
    order: number,
  ): Promise<void> {
    const edgeRepo = manager.getRepository(Edge);

    const edges = await edgeRepo.find({
      where: { projectId },
      order: { position: 'ASC' },
    });

    if (edges.length === 0) {
      await this.makeEdge(projectId, null, newShotId, 0, manager);
      await this.makeEdge(projectId, newShotId, null, 1, manager);
      return;
    }

    const edgeIndex = Math.min(order, edges.length - 1);
    const targetEdge = edges[edgeIndex];

    if (order === 0) {
      await this.makeEdge(projectId, null, newShotId, 0, manager);
      targetEdge.sourceShotId = newShotId;
      targetEdge.position = 1;
      await edgeRepo.save(targetEdge);
    } else {
      await this.makeEdge(
        projectId,
        targetEdge.sourceShotId,
        newShotId,
        edgeIndex,
        manager,
      );
      targetEdge.sourceShotId = newShotId;
      targetEdge.position = edgeIndex + 1;
      await edgeRepo.save(targetEdge);
    }

    for (let i = edgeIndex + 1; i < edges.length; i++) {
      if (edges[i].id !== targetEdge.id) {
        edges[i].position = i + 1;
        await edgeRepo.save(edges[i]);
      }
    }
  }

  private async rebuildEdgePositions(projectId: string, manager?: EntityManager): Promise<void> {
    const shotRepo = manager?.getRepository(Shot) ?? this.shotRepo;
    const edgeRepo = manager?.getRepository(Edge) ?? this.edgeRepo;

    const shots = await shotRepo.find({
      where: { projectId },
      order: { order: 'ASC' },
    });

    await edgeRepo.delete({ projectId } as any);

    if (shots.length === 0) {
      await this.makeEdge(projectId, null, null, 0, manager);
      return;
    }

    // Start → first shot
    await this.makeEdge(projectId, null, shots[0].id, 0, manager);

    // Between shots
    for (let i = 0; i < shots.length - 1; i++) {
      await this.makeEdge(projectId, shots[i].id, shots[i + 1].id, i + 1, manager);
    }

    // Last shot → Merge
    await this.makeEdge(
      projectId,
      shots[shots.length - 1].id,
      null,
      shots.length,
      manager,
    );
  }
}
