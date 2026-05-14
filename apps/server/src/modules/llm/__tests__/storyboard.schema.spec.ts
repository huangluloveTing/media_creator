import { HttpException } from '@nestjs/common';
import { parseJsonResponse, validateStoryboardPayload } from '../storyboard.schema';

describe('storyboard schema', () => {
  const valid = {
    version: '1.0',
    intent: 'test',
    shots: [
      {
        order: 0,
        prompt: 'a',
        shotSize: 'medium',
        angle: 'eye-level',
        movement: 'static',
        duration: 3,
        requiredElements: [],
        forbiddenElements: [],
      },
    ],
  };

  it('accepts valid payload', () => {
    const result = validateStoryboardPayload(valid);
    expect(result.shots).toHaveLength(1);
  });

  it('rejects non json parse', () => {
    expect(() => parseJsonResponse('{bad')).toThrow(HttpException);
  });

  it('rejects too many shots', () => {
    const payload = {
      ...valid,
      shots: Array.from({ length: 6 }, (_, i) => ({ ...valid.shots[0], order: i })),
    };
    expect(() => validateStoryboardPayload(payload)).toThrow(HttpException);
  });

  it('rejects invalid duration', () => {
    const payload = {
      ...valid,
      shots: [{ ...valid.shots[0], duration: 13 }],
    };
    expect(() => validateStoryboardPayload(payload)).toThrow(HttpException);
  });
});
