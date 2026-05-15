import {
  storyboardSchema,
  characterDataSchema,
  worldSettingDataSchema,
  storyOutlineDataSchema,
} from '../storyboard.schema';

describe('Zod storyboard schema', () => {
  const valid = {
    version: '1.0' as const,
    intent: 'test',
    shots: [
      {
        order: 0,
        prompt: 'a',
        shotSize: 'medium' as const,
        angle: 'eye-level' as const,
        movement: 'static' as const,
        duration: 3,
        requiredElements: [],
        forbiddenElements: [],
      },
    ],
  };

  it('accepts valid payload', () => {
    const result = storyboardSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.shots).toHaveLength(1);
  });

  it('rejects invalid JSON (not object)', () => {
    const result = storyboardSchema.safeParse('bad');
    expect(result.success).toBe(false);
  });

  it('rejects too many shots', () => {
    const payload = {
      ...valid,
      shots: Array.from({ length: 6 }, (_, i) => ({ ...valid.shots[0], order: i })),
    };
    const result = storyboardSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('shots'))).toBe(true);
    }
  });

  it('rejects invalid duration', () => {
    const payload = { ...valid, shots: [{ ...valid.shots[0], duration: 13 }] };
    const result = storyboardSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects invalid shot size', () => {
    const payload = { ...valid, shots: [{ ...valid.shots[0], shotSize: 'macro' }] };
    const result = storyboardSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('returns field-level error for multiple issues', () => {
    const payload = { ...valid, shots: [{ ...valid.shots[0], duration: 99, prompt: '' }] };
    const result = storyboardSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('Zod prep schemas', () => {
  it('characterDataSchema accepts valid multi-character data', () => {
    const result = characterDataSchema.safeParse({
      characters: [
        { name: '主', appearance: ['长发'], outfit: ['校服'], traits: ['坚韧'], immutable: [] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('characterDataSchema applies defaults for missing fields', () => {
    const result = characterDataSchema.safeParse({ characters: [{}] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.characters[0].appearance).toEqual([]);
      expect(result.data.characters[0].name).toBe('');
    }
  });

  it('worldSettingDataSchema applies defaults', () => {
    const result = worldSettingDataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.era).toBe('');
  });

  it('storyOutlineDataSchema applies defaults', () => {
    const result = storyOutlineDataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.targetShotCount).toBe(5);
  });
});
