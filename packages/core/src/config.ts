import type { Difficulty, Settings } from "./types";

export interface DifficultyConfig {
  pairs: number;
  moveLimit: number;
  timeLimit: number;
  /** grid columns for portrait / landscape layouts */
  columns: { portrait: number; landscape: number };
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { pairs: 6, moveLimit: 20, timeLimit: 60, columns: { portrait: 3, landscape: 4 } },
  medium: { pairs: 8, moveLimit: 24, timeLimit: 90, columns: { portrait: 4, landscape: 4 } },
  hard: { pairs: 10, moveLimit: 28, timeLimit: 120, columns: { portrait: 4, landscape: 5 } },
};

export const DIFFICULTY_LIST: Difficulty[] = ["easy", "medium", "hard"];

export const MISMATCH_DELAY_MS = 900;

export const CARD_COLORS = [
  "#E5484D", "#3E63DD", "#30A46C", "#F5B400", "#E93D82",
  "#8E4EC6", "#0FA5B5", "#F76B15", "#7C5A3C", "#6E9F1B",
];

export const CARD_SYMBOLS = ["★", "♥", "♣", "♦", "●", "▲", "■", "☀", "☾", "✿"];

export const DEFAULT_SETTINGS: Settings = {
  language: "uz",
  theme: "system",
  symbols: true,
  sound: true,
};
