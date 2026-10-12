export type Difficulty = "easy" | "medium" | "hard";
export type Language = "uz" | "ru" | "en";
export type ThemeMode = "system" | "light" | "dark";
export type GameStatus = "idle" | "playing" | "paused" | "won" | "lost";

export interface Card {
  id: number;
  pairId: number;
  color: string;
  symbol: string;
}

export interface GameState {
  difficulty: Difficulty;
  deck: Card[];
  /** indices of currently face-up, unmatched cards (0..2) */
  flipped: number[];
  /** pairIds that are matched */
  matched: number[];
  moves: number;
  timeLeft: number;
  status: GameStatus;
  /** true while a mismatched pair is shown and waiting to flip back */
  resolving: boolean;
  /** final points, set when the game is won */
  points: number;
}

export interface Settings {
  language: Language;
  theme: ThemeMode;
  /** show a symbol on each card (helps colour-blind players) */
  symbols: boolean;
  sound: boolean;
}

export type BestScores = Partial<Record<Difficulty, number>>;
