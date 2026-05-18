import { z } from 'zod';

// ── Storyboard Shot ──
const SHOT_SIZES = ['extreme-wide', 'wide', 'medium', 'close-up', 'extreme-close-up'] as const;
const ANGLES = ['eye-level', 'low', 'high', 'dutch', 'aerial'] as const;
const MOVEMENTS = ['static', 'pan', 'tilt', 'dolly', 'zoom', 'handheld'] as const;

export const storyboardShotSchema = z
  .object({
    order: z.number().int().min(0),
    prompt: z.string().min(1),
    shotSize: z.enum(SHOT_SIZES),
    angle: z.enum(ANGLES),
    movement: z.enum(MOVEMENTS),
    duration: z.number().int().min(1).max(12),
    requiredElements: z.array(z.string()),
    forbiddenElements: z.array(z.string()),
  })
  .passthrough();

export const storyboardSchema = z
  .object({
    version: z.coerce.string().default('1.0'),
    intent: z.string().min(1),
    shots: z.array(storyboardShotSchema).min(1).max(5),
  })
  .passthrough();

export type StoryboardShot = z.infer<typeof storyboardShotSchema>;
export type StoryboardPayload = z.infer<typeof storyboardSchema>;

// ── Prep Data ──
export const characterProfileSchema = z.object({
  name: z.string().default(''),
  appearance: z.array(z.string()).default([]),
  outfit: z.array(z.string()).default([]),
  traits: z.array(z.string()).default([]),
  immutable: z.array(z.string()).default([]),
});

export const characterDataSchema = z.object({
  characters: z.array(characterProfileSchema).default([]),
});

export const worldSettingDataSchema = z.object({
  era: z.string().default(''),
  location: z.string().default(''),
  atmosphere: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  visualStyle: z.string().default(''),
});

export const storyOutlineDataSchema = z.object({
  premise: z.string().default(''),
  plotBeats: z.array(z.string()).default([]),
  tone: z.string().default(''),
  targetShotCount: z.number().int().min(1).max(10).default(5),
});

export type CharacterProfile = z.infer<typeof characterProfileSchema>;
export type CharacterData = z.infer<typeof characterDataSchema>;
export type WorldSettingData = z.infer<typeof worldSettingDataSchema>;
export type StoryOutlineData = z.infer<typeof storyOutlineDataSchema>;

// ── Prep schema lookup ──
export function getPrepSchema(prepType: string) {
  switch (prepType) {
    case 'character':
      return characterDataSchema;
    case 'world_setting':
      return worldSettingDataSchema;
    case 'story_outline':
      return storyOutlineDataSchema;
    default:
      return characterDataSchema;
  }
}
