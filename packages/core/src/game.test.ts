import { describe, expect, it } from "vitest";
import { DIFFICULTIES, createGame, detectLanguage, gameReducer, generateDeck, parseSettings, shuffle, type Card, type GameState } from "./index";

const deckOf = (...pairIds: number[]): Card[] =>
  pairIds.map((pairId, id) => ({ id, pairId, color: "#000", symbol: "x" }));

const fresh = (deck = deckOf(0, 1, 0, 1)): GameState => ({ ...createGame("easy", deck), timeLeft: 60 });
const flip = (s: GameState, ...idx: number[]) => idx.reduce((st, index) => gameReducer(st, { type: "FLIP", index }), s);

describe("deck", () => {
  it("has two cards per pair for each difficulty", () => {
    for (const [d, cfg] of Object.entries(DIFFICULTIES)) {
      const deck = generateDeck(d as keyof typeof DIFFICULTIES);
      expect(deck).toHaveLength(cfg.pairs * 2);
      for (let p = 0; p < cfg.pairs; p++) expect(deck.filter((c) => c.pairId === p)).toHaveLength(2);
    }
  });
  it("shuffle keeps all items and does not mutate input", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect(out.slice().sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("gameReducer", () => {
  it("starts playing on first flip", () => {
    const s = flip(fresh(), 0);
    expect(s.status).toBe("playing");
    expect(s.flipped).toEqual([0]);
  });
  it("matches a pair, counts a move and clears flipped", () => {
    const s = flip(fresh(), 0, 2);
    expect(s.matched).toEqual([0]);
    expect(s.moves).toBe(1);
    expect(s.flipped).toEqual([]);
  });
  it("mismatch blocks input until RESOLVE", () => {
    let s = flip(fresh(), 0, 1);
    expect(s.resolving).toBe(true);
    expect(flip(s, 2)).toBe(s);
    s = gameReducer(s, { type: "RESOLVE" });
    expect(s.flipped).toEqual([]);
    expect(s.resolving).toBe(false);
  });
  it("ignores flipping the same or a matched card", () => {
    const s = flip(fresh(), 0);
    expect(flip(s, 0)).toBe(s);
    const m = flip(fresh(), 0, 2);
    expect(flip(m, 0)).toBe(m);
  });
  it("wins when all pairs are matched and scores points", () => {
    const s = flip(fresh(), 0, 2, 1, 3);
    expect(s.status).toBe("won");
    expect(s.points).toBe(2 * 100 + 60 * 5 + (DIFFICULTIES.easy.moveLimit - 2) * 10);
  });
  it("loses when the move limit is hit", () => {
    let s = fresh(deckOf(0, 1, 0, 1));
    s = { ...s, moves: DIFFICULTIES.easy.moveLimit - 1 };
    s = flip(s, 0, 1);
    expect(s.status).toBe("lost");
  });
  it("a winning last move beats the move limit", () => {
    const s = flip({ ...fresh(deckOf(0, 0)), moves: DIFFICULTIES.easy.moveLimit - 1 }, 0, 1);
    expect(s.status).toBe("won");
  });
  it("TICK only counts while playing, and loses at zero", () => {
    expect(gameReducer(fresh(), { type: "TICK" }).timeLeft).toBe(60);
    let s = flip(fresh(), 0);
    s = gameReducer(s, { type: "TICK" });
    expect(s.timeLeft).toBe(59);
    s = gameReducer({ ...s, timeLeft: 1 }, { type: "TICK" });
    expect(s.status).toBe("lost");
  });
  it("pause stops ticking and flipping; resume restores", () => {
    let s = gameReducer(flip(fresh(), 0), { type: "PAUSE" });
    expect(s.status).toBe("paused");
    expect(gameReducer(s, { type: "TICK" })).toBe(s);
    expect(flip(s, 1)).toBe(s);
    s = gameReducer(s, { type: "RESUME" });
    expect(s.status).toBe("playing");
  });
  it("NEW_GAME applies the selected difficulty immediately", () => {
    const s = gameReducer(fresh(), { type: "NEW_GAME", difficulty: "hard" });
    expect(s.deck).toHaveLength(DIFFICULTIES.hard.pairs * 2);
    expect(s.timeLeft).toBe(DIFFICULTIES.hard.timeLimit);
  });
});

describe("settings & language", () => {
  it("falls back to defaults on bad data", () => {
    expect(parseSettings("{oops").theme).toBe("system");
    expect(parseSettings(JSON.stringify({ language: "xx", theme: "dark" }))).toMatchObject({ language: "uz", theme: "dark" });
  });
  it("detects language from locale", () => {
    expect(detectLanguage("ru-RU")).toBe("ru");
    expect(detectLanguage("en-US")).toBe("en");
    expect(detectLanguage("de-DE")).toBe("uz");
    expect(detectLanguage(undefined)).toBe("uz");
  });
});
