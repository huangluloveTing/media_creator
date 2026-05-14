import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StoryboardService } from '../storyboard.service';
import { StoryboardDraft } from '../entities/storyboard-draft.entity';
import { Shot } from '../../shot/entities/shot.entity';
import { Edge } from '../../shot/entities/edge.entity';
import { ProjectService } from '../../project/project.service';
import { LlmService } from '../llm.service';

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

  it('creates draft with incremented version', async () => {
    projectService.findOne.mockResolvedValue({ id: 'p1' });
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
    draftRepo.findOne
      .mockResolvedValueOnce({ version: 2, characterProfileJson: { appearance: ['长发'] } })
      .mockResolvedValueOnce({ version: 2 });
    draftRepo.save.mockImplementation(async (x) => ({ id: 'd1', ...x }));

    const res = await service.createDraft({ projectId: 'p1', instruction: 'hello' });
    expect(res.version).toBe(3);
    expect(res.characterProfile).toBeDefined();
  });

  it('throws on invalid llm json', async () => {
    projectService.findOne.mockResolvedValue({ id: 'p1' });
    llmService.draftStoryboard.mockResolvedValue('not-json');
    await expect(service.createDraft({ projectId: 'p1', instruction: 'hello' })).rejects.toThrow();
  });

  it('throws on constraint violation payload', async () => {
    projectService.findOne.mockResolvedValue({ id: 'p1' });
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
});
