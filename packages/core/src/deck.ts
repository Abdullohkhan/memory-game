import { CARD_COLORS, CARD_SYMBOLS, DIFFICULTIES } from "./config";
import type { Card, Difficulty } from "./types";

/** Unbiased Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export function generateDeck(difficulty: Difficulty, random: () => number = Math.random): Card[] {
  const { pairs } = DIFFICULTIES[difficulty];
  const cards: Card[] = [];
  for (let pairId = 0; pairId < pairs; pairId++) {
    const color = CARD_COLORS[pairId] as string;
    const symbol = CARD_SYMBOLS[pairId] as string;
    cards.push({ id: pairId * 2, pairId, color, symbol });
    cards.push({ id: pairId * 2 + 1, pairId, color, symbol });
  }
  return shuffle(cards, random);
}
