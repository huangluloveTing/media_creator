import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryboardDraft } from './entities/storyboard-draft.entity';
import { ProjectService } from '../project/project.service';
import { LlmService } from './llm.service';
import {
  ensureInstruction,
  parseJsonResponse,
  validateStoryboardPayload,
  type StoryboardPayload,
} from './storyboard.schema';
import { Shot } from '../shot/entities/shot.entity';
import { Edge } from '../shot/entities/edge.entity';

export interface CharacterProfile {
  characterName?: string;
  appearance: string[];
  outfit: string[];
  immutableTraits: string[];
  traits: string[];
  confirmed?: boolean;
}

interface PrepNodeData {
  id: string;
  type: string;
  status: string;
  order: number;
  data: Record<string, unknown>;
}

@Injectable()
export class StoryboardService {
  constructor(
    @InjectRepository(StoryboardDraft)
    private readonly draftRepo: Repository<StoryboardDraft>,
    @InjectRepository(Shot)
    private readonly shotRepo: Repository<Shot>,
    @InjectRepository(Edge)
    private readonly edgeRepo: Repository<Edge>,
    private readonly projectService: ProjectService,
    private readonly llmService: LlmService,
  ) {}

  async createDraft(params: {
    projectId: string;
    instruction: string;
    baseDraft?: StoryboardPayload;
    mode?: 'fast' | 'detailed';
  }) {
    const project = await this.projectService.findOne(params.projectId);
    const instruction = ensureInstruction(params.instruction);
    const prepContext = this.collectPrepContext(project);
    this.ensurePrepConfirmed(prepContext);
    const llmRaw = await this.llmService.draftStoryboard({
      instruction,
      baseDraft: params.baseDraft,
      characterProfile: prepContext as unknown as Record<string, unknown>,
      mode: params.mode,
    });
    return this.persistDraftFromRaw(
      params.projectId,
      instruction,
      llmRaw,
      params.baseDraft,
      prepContext,
    );
  }

  async createDraftStream(
    params: {
      projectId: string;
      instruction: string;
      baseDraft?: StoryboardPayload;
      mode?: 'fast' | 'detailed';
    },
    onToken: (chunk: string) => void,
  ) {
    const project = await this.projectService.findOne(params.projectId);
    const instruction = ensureInstruction(params.instruction);
    const prepContext = this.collectPrepContext(project);
    this.ensurePrepConfirmed(prepContext);
    const llmRaw = await this.llmService.draftStoryboardStream(
      {
        instruction,
        baseDraft: params.baseDraft,
        characterProfile: prepContext as unknown as Record<string, unknown>,
        mode: params.mode,
      },
      onToken,
    );
    return this.persistDraftFromRaw(
      params.projectId,
      instruction,
      llmRaw,
      params.baseDraft,
      prepContext,
    );
  }

  private async persistDraftFromRaw(
    projectId: string,
    instruction: string,
    llmRaw: string,
    baseDraft?: StoryboardPayload,
    characterProfile?: Record<string, unknown>,
  ) {
    const parsed = parseJsonResponse(llmRaw);
    const storyboard = validateStoryboardPayload(parsed);
    this.ensureStoryboardContainsCharacterElements(storyboard, characterProfile);
    // validate world setting consistency when world setting is confirmed
    if ((characterProfile as any)?.worldSetting) {
      this.ensureStoryboardMatchesWorldSetting(storyboard, (characterProfile as any).worldSetting);
    }

    const latest = await this.draftRepo.findOne({
      where: { projectId },
      order: { version: 'DESC' },
    });
    const version = (latest?.version ?? 0) + 1;

    const summary = `共 ${storyboard.shots.length} 个镜头，总时长 ${storyboard.shots.reduce((n, s) => n + s.duration, 0)} 秒`;
    const prev = baseDraft?.shots ?? [];
    const diff = storyboard.shots.map((s) => {
      const before = prev[s.order];
      if (!before) return `新增镜头 #${s.order + 1}`;
      const changes: string[] = [];
      if (before.prompt !== s.prompt) changes.push('prompt');
      if (before.shotSize !== s.shotSize) changes.push('shotSize');
      if (before.angle !== s.angle) changes.push('angle');
      if (before.movement !== s.movement) changes.push('movement');
      if (before.duration !== s.duration) changes.push('duration');
      return changes.length
        ? `镜头 #${s.order + 1} 更新: ${changes.join(', ')}`
        : `镜头 #${s.order + 1} 无变化`;
    });

    const entity = this.draftRepo.create({
      projectId,
      version,
      instruction,
      storyboardJson: storyboard as unknown as Record<string, unknown>,
      summary,
      diffJson: { lines: diff } as Record<string, unknown>,
      characterProfileJson: (characterProfile ?? null) as Record<string, unknown> | null,
      createdBy: 'system',
    });
    const saved = await this.draftRepo.save(entity);

    return {
      draftId: saved.id,
      version,
      summary,
      storyboard,
      diff,
      characterProfile,
    };
  }

  async listDrafts(projectId: string) {
    await this.projectService.findOne(projectId);
    const rows = await this.draftRepo.find({
      where: { projectId },
      order: { version: 'DESC' },
    });

    return rows.map((d) => ({
      id: d.id,
      version: d.version,
      summary: d.summary,
      diff: d.diffJson,
      storyboard: d.storyboardJson,
      characterProfile: d.characterProfileJson,
      isApplied: d.isApplied,
      appliedAt: d.appliedAt,
      createdAt: d.createdAt,
    }));
  }

  async applyDraft(projectId: string, draftId: string, mode: 'replace_all') {
    if (mode !== 'replace_all') {
      throw new HttpException('Only replace_all is supported', HttpStatus.BAD_REQUEST);
    }

    await this.projectService.findOne(projectId);
    const draft = await this.draftRepo.findOne({ where: { id: draftId, projectId } });
    if (!draft) throw new NotFoundException('Draft not found');

    const storyboard = validateStoryboardPayload(draft.storyboardJson);

    await this.shotRepo.manager.transaction(async (manager) => {
      await manager.getRepository(Edge).delete({ projectId } as any);
      await manager.getRepository(Shot).delete({ projectId } as any);

      const shotRepo = manager.getRepository(Shot);
      const edgeRepo = manager.getRepository(Edge);
      const savedShots: Shot[] = [];

      for (const s of storyboard.shots) {
        const shot = shotRepo.create({
          projectId,
          order: s.order,
          prompt: s.prompt,
          shotSize: s.shotSize,
          angle: s.angle,
          movement: s.movement,
          duration: s.duration,
          requiredElements: s.requiredElements,
          forbiddenElements: s.forbiddenElements,
          model: 'doubao-seedance-2-0-fast-260128',
          aspectRatio: '16:9',
          resolution: '1080p',
        });
        savedShots.push(await shotRepo.save(shot));
      }

      if (savedShots.length === 0) {
        throw new HttpException('APPLY_TRANSACTION_FAILED', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      await edgeRepo.save(
        edgeRepo.create({
          projectId,
          sourceShotId: null,
          targetShotId: savedShots[0].id,
          position: 0,
        }),
      );
      for (let i = 0; i < savedShots.length - 1; i++) {
        await edgeRepo.save(
          edgeRepo.create({
            projectId,
            sourceShotId: savedShots[i].id,
            targetShotId: savedShots[i + 1].id,
            position: i + 1,
          }),
        );
      }
      await edgeRepo.save(
        edgeRepo.create({
          projectId,
          sourceShotId: savedShots[savedShots.length - 1].id,
          targetShotId: null,
          position: savedShots.length,
        }),
      );

      draft.isApplied = true;
      draft.appliedAt = new Date();
      await manager.getRepository(StoryboardDraft).save(draft);
    });

    return {
      ok: true,
      appliedVersion: draft.version,
      shotCount: storyboard.shots.length,
    };
  }

  private collectPrepContext(project: any): Record<string, unknown> {
    const prepNodes: PrepNodeData[] = project?.prepNodes ?? [];
    const context: Record<string, unknown> = {};

    for (const pn of prepNodes) {
      if (pn.status !== 'confirmed') continue;
      switch (pn.type) {
        case 'character':
          context.characterProfiles = (pn.data as any)?.characters ?? [];
          break;
        case 'world_setting':
          context.worldSetting = pn.data;
          break;
        case 'story_outline':
          context.storyOutline = pn.data;
          break;
      }
    }

    return context;
  }

  private ensurePrepConfirmed(prepContext: Record<string, unknown>) {
    const hasCharacters = !!prepContext.characterProfiles;
    if (!hasCharacters) {
      throw new HttpException('CHARACTER_CONFIRMATION_REQUIRED', HttpStatus.BAD_REQUEST);
    }
  }

  private ensureStoryboardContainsCharacterElements(
    storyboard: StoryboardPayload,
    prepContext?: Record<string, unknown>,
  ) {
    const characters = (prepContext as any)?.characterProfiles as any[] | undefined;
    if (!characters || characters.length === 0) return;

    const keywords: string[] = [];
    for (const c of characters) {
      keywords.push(...(c.appearance ?? []), ...(c.outfit ?? []), ...(c.immutable ?? []));
    }
    const trimmed = keywords.map((x) => String(x).trim()).filter(Boolean);
    if (trimmed.length === 0) return;

    const invalid = storyboard.shots.find((s) => !trimmed.some((k) => s.prompt.includes(k)));
    if (invalid) {
      throw new HttpException('CHARACTER_ELEMENTS_MISSING', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  private ensureStoryboardMatchesWorldSetting(
    storyboard: StoryboardPayload,
    worldSetting: Record<string, unknown> | undefined,
  ) {
    if (!worldSetting) return;
    const location = worldSetting.location as string | undefined;
    const atmosphere = (worldSetting.atmosphere as string[]) ?? [];
    const keywords = [location, ...atmosphere].filter(Boolean).map(String);
    if (keywords.length === 0) return;

    const mismatch = storyboard.shots.find((s) => !keywords.some((k) => s.prompt.includes(k)));
    if (mismatch) {
      throw new HttpException('WORLD_SETTING_MISMATCH', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
