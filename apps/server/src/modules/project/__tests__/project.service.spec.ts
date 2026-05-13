import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectService } from '../project.service';
import { Project } from '../entities/project.entity';

describe('ProjectService', () => {
  let service: ProjectService;
  let repo: Repository<Project>;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    manager: { find: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectService, { provide: getRepositoryToken(Project), useValue: mockRepo }],
    }).compile();

    service = module.get(ProjectService);
    repo = module.get(getRepositoryToken(Project));
  });

  it('creates a project with default settings', async () => {
    const dto = { title: 'Test Project' };
    const created = {
      id: '1',
      title: 'Test Project',
      resolution: '1920x1080',
      fps: 24,
      status: 'draft',
    };
    mockRepo.create.mockReturnValue(created);
    mockRepo.save.mockResolvedValue(created);

    const result = await service.create(dto);
    expect(result.title).toBe('Test Project');
    expect(result.resolution).toBe('1920x1080');
    expect(result.fps).toBe(24);
    expect(result.status).toBe('draft');
  });

  it('throws when project not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('nonexistent')).rejects.toThrow('Project nonexistent not found');
  });

  it('updates project settings', async () => {
    const existing = { id: '1', title: 'Old', resolution: '1920x1080' };
    const updated = { ...existing, title: 'New' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue(updated);

    const result = await service.update('1', { title: 'New' });
    expect(result.title).toBe('New');
  });

  it('deletes project', async () => {
    const existing = { id: '1', title: 'Test' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.remove.mockResolvedValue(undefined);

    await service.remove('1');
    expect(mockRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('transitions project status via recalculateStatus', async () => {
    const project = { id: '1', status: 'draft' };
    mockRepo.findOne.mockResolvedValue(project);
    mockRepo.manager.find.mockResolvedValue([]);
    mockRepo.save.mockResolvedValue({ ...project, status: 'draft' });

    const result = await service.recalculateStatus('1');
    expect(result.status).toBe('draft');
  });
});
