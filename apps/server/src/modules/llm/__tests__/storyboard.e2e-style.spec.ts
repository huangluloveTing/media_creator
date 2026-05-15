import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StoryboardService } from '../storyboard.service';
import { StoryboardDraft } from '../entities/storyboard-draft.entity';
import { Shot } from '../../shot/entities/shot.entity';
import { Edge } from '../../shot/entities/edge.entity';
import { ProjectService } from '../../project/project.service';
import { LlmService } from '../llm.service';

describe('Storyboard e2e-style flow', () => {
  let service: StoryboardService;

  const savedDrafts: any[] = [];
  const draftRepo = {
    findOne: jest.fn(async (opts?: any) => {
      const pid = opts?.where?.projectId;
      if (!pid) return null;
      const rows = savedDrafts.filter((d) => d.projectId === pid);
      if (rows.length === 0) return null;
      rows.sort((a, b) => b.version - a.version);
      return rows[0];
    }),
    save: jest.fn(async (x) => {
      const out = { id: x.id ?? `d-${savedDrafts.length + 1}`, ...x };
      savedDrafts.push(out);
      return out;
    }),
    create: jest.fn((v) => v),
    find: jest.fn(async (opts?: any) => {
      const pid = opts?.where?.projectId;
      return savedDrafts.filter((d) => d.projectId === pid).sort((a, b) => b.version - a.version);
    }),
  };

  const shotRepo = { manager: { transaction: jest.fn() } };
  const edgeRepo = {};
  const projectService = {
    findOne: jest.fn(async (id: string) => ({
      id,
      prepNodes: [
        {
          type: 'character',
          status: 'confirmed',
          order: 0,
          data: {
            characters: [
              {
                name: '女主',
                appearance: ['长发'],
                outfit: ['校服'],
                traits: ['坚韧'],
                immutable: [],
              },
            ],
          },
        },
      ],
    })),
  };

  const llmService = {
    draftStoryboard: jest.fn(),
    draftStoryboardStream: jest.fn(),
  };

  beforeEach(async () => {
    savedDrafts.length = 0;
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryboardService,
        { provide: getRepositoryToken(StoryboardDraft), useValue: draftRepo },
        { provide: getRepositoryToken(Shot), useValue: shotRepo },
        { provide: getRepositoryToken(Edge), useValue: edgeRepo },
        { provide: ProjectService, useValue: projectService },
        { provide: LlmService, useValue: llmService },
      ],
    }).compile();

    service = module.get(StoryboardService);
  });

  it('keeps character consistency across multi-round drafts and preserves user intent direction', async () => {
    llmService.draftStoryboard.mockResolvedValueOnce({
      version: '1.0' as const,
      intent: '女主雨夜追逐，紧张感',
      shots: [
        {
          order: 0,
          prompt: '雨夜街头，长发女主身穿校服回头张望，紧张呼吸。',
          shotSize: 'medium' as const,
          angle: 'eye-level' as const,
          movement: 'handheld' as const,
          duration: 5,
          requiredElements: ['长发女主', '校服', '雨夜'],
          forbiddenElements: [],
        },
      ],
    });

    const r1 = await service.createDraft({
      projectId: 'p1',
      instruction: '一个长发女生穿校服在雨夜被追逐，节奏紧张',
      mode: 'fast',
    });

    llmService.draftStoryboard.mockResolvedValueOnce({
      version: '1.0' as const,
      intent: '保持同一女主，增加动作冲突',
      shots: [
        {
          order: 0,
          prompt: '同一长发校服女主冲入小巷，手持镜头快速跟进。',
          shotSize: 'wide' as const,
          angle: 'low' as const,
          movement: 'handheld' as const,
          duration: 4,
          requiredElements: ['长发女主', '校服'],
          forbiddenElements: ['短发'],
        },
      ],
    });

    const r2 = await service.createDraft({
      projectId: 'p1',
      instruction: '保持同一角色，节奏更快，冲入小巷',
      baseDraft: r1.storyboard,
      mode: 'detailed',
    });

    expect(r1.characterProfile).toBeDefined();
    expect(r2.characterProfile).toBeDefined();
    const characters = ((r2.characterProfile as any)?.characterProfiles ?? []) as any[];
    const appearance = (characters[0]?.appearance ?? []) as string[];
    const outfit = (characters[0]?.outfit ?? []) as string[];
    expect(appearance).toContain('长发');
    expect(outfit).toContain('校服');

    expect(r2.storyboard.intent).toContain('同一');
    expect(r2.storyboard.shots[0].prompt).toContain('同一长发校服女主');
    expect(r2.diff.length).toBeGreaterThan(0);
  });
});
