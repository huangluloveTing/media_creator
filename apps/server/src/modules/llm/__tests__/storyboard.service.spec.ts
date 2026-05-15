import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StoryboardService } from '../storyboard.service';
import { StoryboardDraft } from '../entities/storyboard-draft.entity';
import { Shot } from '../../shot/entities/shot.entity';
import { Edge } from '../../shot/entities/edge.entity';
import { ProjectService } from '../../project/project.service';
import { LlmService } from '../llm.service';

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
        {
          name: '主角',
          appearance: appearances,
          outfit: outfits,
          traits,
          immutable: [],
        },
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
  const shotRepo = {
    manager: { transaction: jest.fn() },
  };
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
      JSON.stringify({
        version: '1.0',
        intent: 'x',
        shots: [
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
        ],
      }),
    );
    draftRepo.findOne.mockResolvedValue({
      version: 2,
    });
    draftRepo.save.mockImplementation(async (x) => ({ id: 'd1', ...x }));

    const res = await service.createDraft({ projectId: 'p1', instruction: 'hello' });
    expect(res.version).toBe(3);
    expect(res.characterProfile).toBeDefined();
  });

  it('throws on invalid llm json', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p1',
      prepNodes: [makeCharacterPrepNode(true, [], [], [])],
    });
    llmService.draftStoryboard.mockResolvedValue('not-json');
    await expect(service.createDraft({ projectId: 'p1', instruction: 'hello' })).rejects.toThrow();
  });

  it('throws on constraint violation payload', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p1',
      prepNodes: [makeCharacterPrepNode(true, [], [], [])],
    });
    llmService.draftStoryboard.mockResolvedValue(
      JSON.stringify({
        version: '1.0',
        intent: 'x',
        shots: [
          {
            order: 0,
            prompt: 'test',
            shotSize: 'medium',
            angle: 'eye-level',
            movement: 'static',
            duration: 99,
            requiredElements: [],
            forbiddenElements: [],
          },
        ],
      }),
    );
    await expect(service.createDraft({ projectId: 'p1', instruction: 'hello' })).rejects.toThrow();
  });

  it('apply rolls back on transaction failure', async () => {
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
    const mockSave = jest.fn().mockRejectedValue(new Error('boom'));
    const mockCreate = jest.fn((x) => x);
    shotRepo.manager.transaction.mockImplementation(async (cb: any) => {
      const manager = {
        getRepository: () => ({
          delete: mockDelete,
          save: mockSave,
          create: mockCreate,
        }),
      };
      await cb(manager);
    });

    await expect(service.applyDraft('p1', 'd1', 'replace_all')).rejects.toThrow('boom');
  });

  it('allows draft with unconfirmed prep nodes (no gate)', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p1',
      prepNodes: [makeCharacterPrepNode(false, ['长发'], [], [])],
    });
    llmService.draftStoryboard.mockResolvedValue(
      JSON.stringify({
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
      }),
    );
    draftRepo.findOne.mockResolvedValue({ version: 0 });
    draftRepo.save.mockImplementation(async (x) => ({ id: 'd1', ...x }));

    const res = await service.createDraft({ projectId: 'p1', instruction: 'test' });
    expect(res.version).toBe(1);
  });

  it('rejects storyboard when shot prompt misses character elements', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p1',
      prepNodes: [makeCharacterPrepNode(true, ['长发'], ['校服'], [])],
    });
    llmService.draftStoryboard.mockResolvedValue(
      JSON.stringify({
        version: '1.0',
        intent: 'x',
        shots: [
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
        ],
      }),
    );
    await expect(service.createDraft({ projectId: 'p1', instruction: 'test' })).rejects.toThrow(
      'CHARACTER_ELEMENTS_MISSING',
    );
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
      JSON.stringify({
        version: '1.0',
        intent: 'x',
        shots: [
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
        ],
      }),
    );
    draftRepo.findOne.mockResolvedValue({ version: 0 });
    draftRepo.save.mockImplementation(async (x) => ({ id: 'd2', ...x }));

    const res = await service.createDraft({ projectId: 'p2', instruction: '生成分镜' });
    expect(res.characterProfile).toBeDefined();
    expect((res.characterProfile as any).characterProfiles).toBeDefined();
    expect((res.characterProfile as any).worldSetting).toBeDefined();
    expect((res.characterProfile as any).storyOutline).toBeDefined();
  });

  it('uses storyOutline targetShotCount for max shots constraint', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p3',
      prepNodes: [
        makeCharacterPrepNode(true, [], [], []),
        {
          type: 'story_outline',
          status: 'confirmed',
          order: 0,
          data: { premise: 'test', plotBeats: [], tone: 'neutral', targetShotCount: 3 },
        },
      ],
    });
    llmService.draftStoryboard.mockResolvedValue(
      JSON.stringify({
        version: '1.0',
        intent: 'x',
        shots: [
          {
            order: 0,
            prompt: 'a',
            shotSize: 'medium',
            angle: 'eye-level',
            movement: 'static',
            duration: 5,
            requiredElements: [],
            forbiddenElements: [],
          },
        ],
      }),
    );
    draftRepo.findOne.mockResolvedValue({ version: 0 });
    draftRepo.save.mockImplementation(async (x) => ({ id: 'd3', ...x }));

    await service.createDraft({ projectId: 'p3', instruction: 'test' });
    // Verify draft was created successfully with story outline context
    expect(draftRepo.save).toHaveBeenCalled();
  });

  it('allows draft with mixed confirmed/unconfirmed prep nodes', async () => {
    projectService.findOne.mockResolvedValue({
      id: 'p1',
      prepNodes: [
        makeCharacterPrepNode(false, ['长发'], [], []),
        {
          type: 'world_setting',
          status: 'confirmed',
          order: 1,
          data: { era: '现代', location: '', atmosphere: [], rules: [], visualStyle: '' },
        },
      ],
    });
    llmService.draftStoryboard.mockResolvedValue(
      JSON.stringify({
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
      }),
    );
    draftRepo.findOne.mockResolvedValue({ version: 0 });
    draftRepo.save.mockImplementation(async (x) => ({ id: 'd2', ...x }));

    const res = await service.createDraft({ projectId: 'p1', instruction: 'test' });
    expect(res.version).toBe(1);
  });
});
