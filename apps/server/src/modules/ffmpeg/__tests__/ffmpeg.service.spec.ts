import { Test, TestingModule } from '@nestjs/testing';
import { FFmpegService } from '../ffmpeg.service';

describe('FFmpegService', () => {
  let service: FFmpegService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FFmpegService],
    }).compile();

    service = module.get(FFmpegService);
  });

  it('validates prerequisites - reports incomplete shots', async () => {
    const shots: any[] = [
      {
        id: '1',
        order: 0,
        generationTask: { status: 'completed', localPath: '/tmp/test.mp4' },
      },
      {
        id: '2',
        order: 1,
        generationTask: null,
      },
      {
        id: '3',
        order: 2,
        generationTask: { status: 'failed', localPath: null },
      },
    ];

    const issues = await service.validatePrerequisites(shots);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes('Shot order 1'))).toBe(true);
    expect(issues.some((i) => i.includes('Shot order 2'))).toBe(true);
  });

  it('validates prerequisites - all completed passes', async () => {
    const shots: any[] = [
      {
        id: '1',
        order: 0,
        generationTask: { status: 'completed', localPath: '/tmp/test.mp4' },
      },
    ];

    const issues = await service.validatePrerequisites(shots);
    expect(issues.length).toBe(0);
  });
});
