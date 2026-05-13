export const CARD_WIDTH = 156;
export const CARD_HEIGHT = 148;
export const ARROW_WIDTH = 72;
export const CONNECTOR_WIDTH = 32;

const PADDING_X = 16;
const PADDING_Y = 20;
const BORDER = 2;
const HEADER_HEIGHT = 60;
const EMPTY_TEXT_WIDTH = 240;

export function getShotsContainerWidth(shotCount: number): number {
  const inner =
    shotCount > 0
      ? shotCount * CARD_WIDTH +
        Math.max(0, shotCount - 1) * ARROW_WIDTH +
        CONNECTOR_WIDTH +
        CARD_WIDTH
      : EMPTY_TEXT_WIDTH + CARD_WIDTH;
  return inner + 2 * PADDING_X + 2 * BORDER;
}

export function getShotsContainerHeight(): number {
  return HEADER_HEIGHT + CARD_HEIGHT + 2 * PADDING_Y + 2 * BORDER;
}
