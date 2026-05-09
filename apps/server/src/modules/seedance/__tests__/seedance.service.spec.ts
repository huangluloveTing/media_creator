import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SeedanceService } from '../seedance.service';

describe('SeedanceService', () => {
  let service: SeedanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedanceService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              if (key === 'SEEDANCE_API_KEY') return 'test-key';
              return fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(SeedanceService);
  });

  it('throws when API key is missing', async () => {
    const module2 = await Test.createTestingModule({
      providers: [
        SeedanceService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => undefined) },
        },
      ],
    }).compile();

    const svc2 = module2.get(SeedanceService);
    await expect(svc2.submit({ prompt: 'test' })).rejects.toThrow('Seedance API key not configured');
  });
});
