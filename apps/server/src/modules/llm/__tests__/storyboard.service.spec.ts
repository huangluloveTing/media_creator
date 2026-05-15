import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StoryboardService } from '../storyboard.service';
import { StoryboardDraft } from '../entities/storyboard-draft.entity';
import { Shot } from '../../shot/entities/shot.entity';
import { Edge } from '../../shot/entities/edge.entity';
import { ProjectService } from '../../project/project.service';
import { LlmService } from '../llm.service';
import type { StoryboardPayload } from '../storyboard.schema';

function makeStoryboardPayload(shots: Partial<StoryboardPayload['shots']> = []): StoryboardPayload {
  return {
    version: '1.0' as const,
    intent: 'test intent',
    shots: (shots.length
      ? shots
      : [
          {
            order: 0,
            prompt: 'test',
            shotSize: 'medium' as const,
            angle: 'eye-level' as const,
            movement: 'static' as const,
            duration: 5,
            requiredElements: [],
            forbiddenElements: [],
          },
        ]) as StoryboardPayload['shots'],
  };
}

function makeCharacterPrepNode(
  confirmed: boolean,
  appearances: string[],
  outfits: string[],
  traits: string[],
) {
  return {
    type: 'character',
    status: confirmed ? 'confirmed' : 'drafting',
    order: 0,
    data: {
      characters: [
        { name: '主角', appearance: appearances, outfit: outfits, traits, immutable: [] },
      ],
    },
  };
}

describe('StoryboardService', () => {
  let service: StoryboardService;

  const draftRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => v),
    find: jest.fn(),
  };
  const shotRepo = { manager: { transaction: jest.fn() } };
  const edgeRepo = {};
  const projectService = { findOne: jest.fn() };
  const llmService = { draftStoryboard: jest.fn(), draftStoryboardStream: jest.fn() };

  beforeEach(async () => {
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

  it('creates draft with incremented version using prepNodes', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p1',
      prepNodes: [makeCharacterPrepNode(true, ['长发'], ['校服'], ['坚韧'])],
    });
    llmService.draftStoryboard.mockResolvedValue(
      makeStoryboardPayload([
        {
          order: 0,
          prompt: '长发角色穿校服在街头奔跑',
          shotSize: 'medium',
          angle: 'eye-level',
          movement: 'static',
          duration: 5,
          requiredElements: [],
          forbiddenElements: [],
        },
      ]),
    );
    draftRepo.findOne.mockResolvedValue({ version: 2 });
    draftRepo.save.mockImplementation(async (x: any) => ({ id: 'd1', ...x }));

    const res = await service.createDraft({ projectId: 'p1', instruction: 'hello' });
    expect(res.version).toBe(3);
    expect(res.characterProfile).toBeDefined();
  });

  it('allows draft with unconfirmed prep nodes (no gate)', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p1',
      prepNodes: [makeCharacterPrepNode(false, ['长发'], [], [])],
    });
    llmService.draftStoryboard.mockResolvedValue(makeStoryboardPayload());
    draftRepo.findOne.mockResolvedValue({ version: 0 });
    draftRepo.save.mockImplementation(async (x: any) => ({ id: 'd1', ...x }));

    const res = await service.createDraft({ projectId: 'p1', instruction: 'test' });
    expect(res.version).toBe(1);
  });

  it('warns instead of rejecting when shot prompt misses character elements', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    projectService.findOne.mockResolvedValue({
      id: 'p1',
      prepNodes: [makeCharacterPrepNode(true, ['长发'], ['校服'], [])],
    });
    llmService.draftStoryboard.mockResolvedValue(
      makeStoryboardPayload([
        {
          order: 0,
          prompt: '空房间中的桌子',
          shotSize: 'medium',
          angle: 'eye-level',
          movement: 'static',
          duration: 5,
          requiredElements: [],
          forbiddenElements: [],
        },
      ]),
    );
    draftRepo.findOne.mockResolvedValue({ version: 0 });
    draftRepo.save.mockImplementation(async (x: any) => ({ id: 'd1', ...x }));

    const res = await service.createDraft({ projectId: 'p1', instruction: 'test' });
    expect(res.version).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('collects prep context from confirmed prepNodes (multiple types)', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p2',
      prepNodes: [
        makeCharacterPrepNode(true, ['长发'], ['校服'], ['坚韧']),
        {
          type: 'world_setting',
          status: 'confirmed',
          order: 1,
          data: {
            era: '近未来',
            location: '东京',
            atmosphere: ['赛博朋克'],
            rules: [],
            visualStyle: '暗色调',
          },
        },
        {
          type: 'story_outline',
          status: 'confirmed',
          order: 2,
          data: {
            premise: '追击',
            plotBeats: ['发现', '追逐', '真相'],
            tone: '紧张',
            targetShotCount: 4,
          },
        },
      ],
    });
    llmService.draftStoryboard.mockResolvedValue(
      makeStoryboardPayload([
        {
          order: 0,
          prompt: '长发角色在东京赛博朋克街道奔跑',
          shotSize: 'medium',
          angle: 'eye-level',
          movement: 'static',
          duration: 5,
          requiredElements: [],
          forbiddenElements: [],
        },
      ]),
    );
    draftRepo.findOne.mockResolvedValue({ version: 0 });
    draftRepo.save.mockImplementation(async (x: any) => ({ id: 'd2', ...x }));

    const res = await service.createDraft({ projectId: 'p2', instruction: '生成分镜' });
    expect((res.characterProfile as any).characterProfiles).toBeDefined();
    expect((res.characterProfile as any).worldSetting).toBeDefined();
    expect((res.characterProfile as any).storyOutline).toBeDefined();
  });

  it('apply validates draft JSON with Zod schema', async () => {
    projectService.findOne.mockResolvedValue({ id: 'p1' });
    draftRepo.findOne.mockResolvedValue({
      id: 'd1',
      projectId: 'p1',
      version: 1,
      storyboardJson: {
        version: '1.0',
        intent: 'x',
        shots: [
          {
            order: 0,
            prompt: 'test',
            shotSize: 'medium',
            angle: 'eye-level',
            movement: 'static',
            duration: 5,
            requiredElements: [],
            forbiddenElements: [],
          },
        ],
      },
    });

    const mockDelete = jest.fn();
    const mockSave = jest.fn().mockResolvedValue({});
    const mockCreate = jest.fn((x) => x);
    shotRepo.manager.transaction.mockImplementation(async (cb: any) => {
      await cb({
        getRepository: () => ({ delete: mockDelete, save: mockSave, create: mockCreate }),
      });
    });

    const result = await service.applyDraft('p1', 'd1', 'replace_all');
    expect(result.ok).toBe(true);
    expect(result.shotCount).toBe(1);
  });

  it('rejects invalid stored draft JSON on apply', async () => {
    projectService.findOne.mockResolvedValue({ id: 'p1' });
    draftRepo.findOne.mockResolvedValue({
      id: 'd1',
      projectId: 'p1',
      version: 1,
      storyboardJson: { version: '2.0', intent: '', shots: [] },
    });

    await expect(service.applyDraft('p1', 'd1', 'replace_all')).rejects.toThrow();
  });
});
