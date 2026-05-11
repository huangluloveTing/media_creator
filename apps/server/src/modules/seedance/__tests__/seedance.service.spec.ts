import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../../settings/settings.service';
import { SeedanceService } from '../seedance.service';

const mockSettingsService = {
  getRaw: jest.fn(() => Promise.resolve(null)),
};

describe('SeedanceService', () => {
  let service: SeedanceService;

  beforeEach(async () => {
    mockSettingsService.getRaw.mockResolvedValue(null);

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
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get(SeedanceService);
  });

  it('throws when API key is missing in both db and env', async () => {
    const module2 = await Test.createTestingModule({
      providers: [
        SeedanceService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => undefined) },
        },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    const svc2 = module2.get(SeedanceService);
    await expect(svc2.submit({ prompt: 'test' })).rejects.toThrow('Seedance API key not configured');
  });

  it('uses db key when available', async () => {
    const module2 = await Test.createTestingModule({
      providers: [
        SeedanceService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => undefined) },
        },
        {
          provide: SettingsService,
          useValue: { getRaw: jest.fn((key: string) => Promise.resolve('db-api-key')) },
        },
      ],
    }).compile();

    const svc2 = module2.get(SeedanceService);
    // The submit will fail at HTTP level (fake key), but it should NOT throw "API key not configured"
    await expect(svc2.submit({ prompt: 'test' })).rejects.not.toThrow('Seedance API key not configured');
  });
});
