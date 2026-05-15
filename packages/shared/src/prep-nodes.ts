import type { PrepNode, CharacterData } from './types';

export function migrateCharacterProfileToPrepNodes(
  characterProfileJson: Record<string, unknown> | null,
  existingPrepNodes?: Record<string, unknown>[],
): PrepNode[] {
  if (existingPrepNodes && existingPrepNodes.length > 0) {
    return existingPrepNodes as unknown as PrepNode[];
  }

  const nodes: PrepNode[] = [];

  if (characterProfileJson) {
    const p = characterProfileJson as Record<string, unknown>;
    const characters = [
      {
        name: (p.characterName as string) ?? '',
        appearance: (p.appearance as string[]) ?? [],
        outfit: (p.outfit as string[]) ?? [],
        traits: (p.traits as string[]) ?? [],
        immutable: (p.immutableTraits as string[]) ?? [],
      },
    ];

    nodes.push({
      id: 'character',
      type: 'character',
      status: (characterProfileJson as any).confirmed ? 'confirmed' : 'drafting',
      order: 0,
      data: { characters } as CharacterData,
    });
  }

  return nodes;
}
