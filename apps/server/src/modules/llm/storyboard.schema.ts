import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import type { ShotAngle, ShotMovement, ShotSize } from '@media-creator/shared';

export interface StoryboardShot {
  order: number;
  prompt: string;
  shotSize: ShotSize;
  angle: ShotAngle;
  movement: ShotMovement;
  duration: number;
  requiredElements: string[];
  forbiddenElements: string[];
}

export interface StoryboardPayload {
  version: '1.0';
  intent: string;
  shots: StoryboardShot[];
}

const SHOT_SIZES = new Set<ShotSize>([
  'extreme-wide',
  'wide',
  'medium',
  'close-up',
  'extreme-close-up',
]);
const ANGLES = new Set<ShotAngle>(['eye-level', 'low', 'high', 'dutch', 'aerial']);
const MOVEMENTS = new Set<ShotMovement>(['static', 'pan', 'tilt', 'dolly', 'zoom', 'handheld']);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseJsonResponse(content: string): unknown {
  // 1. Direct JSON parse
  try {
    return JSON.parse(content);
  } catch {
    // continue
  }

  // 2. Extract from ```json ... ``` block
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // continue
    }
  }

  // 3. Find first { or [ and try to parse from there
  const braceStart = content.indexOf('{');
  const bracketStart = content.indexOf('[');
  const start =
    braceStart >= 0 && bracketStart >= 0
      ? Math.min(braceStart, bracketStart)
      : Math.max(braceStart, bracketStart);
  if (start >= 0) {
    try {
      return JSON.parse(content.slice(start));
    } catch {
      // continue
    }
  }

  throw new HttpException('INVALID_LLM_FORMAT', HttpStatus.UNPROCESSABLE_ENTITY);
}

export function validateStoryboardPayload(input: unknown): StoryboardPayload {
  if (!isObject(input)) {
    throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
  }

  const allowedKeys = new Set(['version', 'intent', 'shots']);
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  if (input.version !== '1.0' || typeof input.intent !== 'string' || !input.intent.trim()) {
    throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
  }

  if (!Array.isArray(input.shots) || input.shots.length < 1 || input.shots.length > 5) {
    throw new HttpException('CONSTRAINT_VIOLATION', HttpStatus.UNPROCESSABLE_ENTITY);
  }

  const shots: StoryboardShot[] = input.shots.map((raw, idx) => {
    if (!isObject(raw)) {
      throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const shotAllowedKeys = new Set([
      'order',
      'prompt',
      'shotSize',
      'angle',
      'movement',
      'duration',
      'requiredElements',
      'forbiddenElements',
    ]);
    for (const key of Object.keys(raw)) {
      if (!shotAllowedKeys.has(key)) {
        throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    if (raw.order !== idx)
      throw new HttpException('CONSTRAINT_VIOLATION', HttpStatus.UNPROCESSABLE_ENTITY);
    if (typeof raw.prompt !== 'string' || !raw.prompt.trim()) {
      throw new HttpException('CONSTRAINT_VIOLATION', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (!SHOT_SIZES.has(raw.shotSize as ShotSize)) {
      throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (!ANGLES.has(raw.angle as ShotAngle)) {
      throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (!MOVEMENTS.has(raw.movement as ShotMovement)) {
      throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (typeof raw.duration !== 'number' || raw.duration < 1 || raw.duration > 12) {
      throw new HttpException('CONSTRAINT_VIOLATION', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (
      !Array.isArray(raw.requiredElements) ||
      !raw.requiredElements.every((v) => typeof v === 'string')
    ) {
      throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (
      !Array.isArray(raw.forbiddenElements) ||
      !raw.forbiddenElements.every((v) => typeof v === 'string')
    ) {
      throw new HttpException('INVALID_STORYBOARD_SCHEMA', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return {
      order: raw.order,
      prompt: raw.prompt,
      shotSize: raw.shotSize as ShotSize,
      angle: raw.angle as ShotAngle,
      movement: raw.movement as ShotMovement,
      duration: raw.duration,
      requiredElements: raw.requiredElements,
      forbiddenElements: raw.forbiddenElements,
    };
  });

  return { version: '1.0', intent: input.intent, shots };
}

export function ensureInstruction(instruction?: string): string {
  if (!instruction || !instruction.trim()) {
    throw new BadRequestException('instruction is required');
  }
  return instruction.trim();
}
