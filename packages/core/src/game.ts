import { DIFFICULTIES } from "./config";
import { generateDeck } from "./deck";
import type { Difficulty, GameState } from "./types";

export type GameAction =
  | { type: "NEW_GAME"; difficulty: Difficulty; deck?: GameState["deck"] }
  | { type: "FLIP"; index: number }
  | { type: "RESOLVE" }
  | { type: "TICK" }
  | { type: "PAUSE" }
  | { type: "RESUME" };

export function createGame(difficulty: Difficulty, deck = generateDeck(difficulty)): GameState {
  return {
    difficulty,
    deck,
    flipped: [],
    matched: [],
    moves: 0,
    timeLeft: DIFFICULTIES[difficulty].timeLimit,
    status: "idle",
    resolving: false,
    points: 0,
  };
}

/** Points for a won game: pairs, plus bonuses for time and moves left. Shared with the server for validation. */
export function computePoints(difficulty: Difficulty, moves: number, timeLeft: number): number {
  const cfg = DIFFICULTIES[difficulty];
  return cfg.pairs * 100 + timeLeft * 5 + Math.max(0, cfg.moveLimit - moves) * 10;
}

/** True if a reported result is physically possible for the difficulty. */
export function isValidResult(difficulty: Difficulty, moves: number, timeLeft: number): boolean {
  const cfg = DIFFICULTIES[difficulty];
  return (
    Number.isInteger(moves) &&
    Number.isInteger(timeLeft) &&
    moves >= cfg.pairs &&
    moves <= cfg.moveLimit &&
    timeLeft >= 0 &&
    timeLeft <= cfg.timeLimit
  );
}

export function calcPoints(state: GameState): number {
  return computePoints(state.difficulty, state.moves, state.timeLeft);
}

export function isActive(state: GameState): boolean {
  return state.status === "idle" || state.status === "playing";
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME":
      return createGame(action.difficulty, action.deck);

    case "FLIP": {
      if (!isActive(state) || state.resolving) return state;
      const card = state.deck[action.index];
      if (!card || state.flipped.includes(action.index) || state.matched.includes(card.pairId)) {
        return state;
      }
      const status = state.status === "idle" ? "playing" : state.status;
      const flipped = [...state.flipped, action.index];
      if (flipped.length < 2) return { ...state, status, flipped };

      // second card: count the move and check for a match
      const [a, b] = flipped.map((i) => state.deck[i]);
      const moves = state.moves + 1;
      if (a && b && a.pairId === b.pairId) {
        const matched = [...state.matched, a.pairId];
        const won = matched.length === state.deck.length / 2;
        const next: GameState = { ...state, status: won ? "won" : status, flipped: [], matched, moves };
        return won ? { ...next, points: calcPoints(next) } : next;
      }
      const lost = moves >= DIFFICULTIES[state.difficulty].moveLimit;
      return { ...state, status: lost ? "lost" : status, flipped, moves, resolving: true };
    }

    case "RESOLVE":
      return state.resolving ? { ...state, flipped: [], resolving: false } : state;

    case "TICK": {
      if (state.status !== "playing") return state;
      const timeLeft = Math.max(0, state.timeLeft - 1);
      return { ...state, timeLeft, status: timeLeft === 0 ? "lost" : "playing" };
    }

    case "PAUSE":
      return state.status === "playing" ? { ...state, status: "paused" } : state;

    case "RESUME":
      return state.status === "paused" ? { ...state, status: "playing" } : state;

    default:
      return state;
  }
}

/** A card is face-up when selected or already matched (or the game is lost, to reveal the board). */
export function isCardFaceUp(state: GameState, index: number): boolean {
  const card = state.deck[index];
  if (!card) return false;
  return state.flipped.includes(index) || state.matched.includes(card.pairId);
}

export function bestKey(difficulty: Difficulty): string {
  return `memory.best.${difficulty}`;
}

/** Returns the new best score if `points` beats `best`, otherwise `best`. */
export function nextBest(best: number | undefined, points: number): number {
  return Math.max(best ?? 0, points);
}
