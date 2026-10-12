import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  DIFFICULTY_LIST,
  MISMATCH_DELAY_MS,
  bestKey,
  createGame,
  gameReducer,
  nextBest,
  type BestScores,
  type Difficulty,
} from "@memory/core";
import { playSfx } from "../sound";

function loadBest(): BestScores {
  const out: BestScores = {};
  for (const d of DIFFICULTY_LIST) {
    try {
      const n = Number(localStorage.getItem(bestKey(d)));
      if (Number.isFinite(n) && n > 0) out[d] = n;
    } catch {
      /* ignore */
    }
  }
  return out;
}

export function useGame(soundOn: boolean) {
  const [state, dispatch] = useReducer(gameReducer, "easy" as Difficulty, (d) => createGame(d));
  const [best, setBest] = useState<BestScores>(loadBest);
  const [newRecord, setNewRecord] = useState(false);

  const sfx = useCallback((name: Parameters<typeof playSfx>[0]) => {
    if (soundOn) playSfx(name);
  }, [soundOn]);

  // countdown
  useEffect(() => {
    if (state.status !== "playing") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  // flip mismatched cards back
  useEffect(() => {
    if (!state.resolving) return;
    const id = setTimeout(() => dispatch({ type: "RESOLVE" }), MISMATCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [state.resolving]);

  // record keeping: adjust state while rendering when the game transitions to "won"
  const [seenStatus, setSeenStatus] = useState(state.status);
  if (seenStatus !== state.status) {
    setSeenStatus(state.status);
    if (state.status === "won") {
      const improved = state.points > (best[state.difficulty] ?? 0);
      setNewRecord(improved);
      if (improved) setBest({ ...best, [state.difficulty]: nextBest(best[state.difficulty], state.points) });
    }
  }

  useEffect(() => {
    for (const [d, value] of Object.entries(best)) {
      try {
        localStorage.setItem(bestKey(d as Difficulty), String(value));
      } catch {
        /* ignore */
      }
    }
  }, [best]);

  // sound effects for game events
  const prev = useRef(state);
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (state.matched.length > p.matched.length && state.status !== "won") sfx("match");
    if (state.resolving && !p.resolving) sfx("mismatch");
    if (state.status === "won" && p.status !== "won") sfx("win");
    if (state.status === "lost" && p.status !== "lost") sfx("lose");
  }, [state, sfx]);

  const flip = useCallback(
    (index: number) => {
      sfx("flip");
      dispatch({ type: "FLIP", index });
    },
    [sfx],
  );
  const mergeBest = useCallback((incoming: BestScores) => {
    setBest((b) => {
      const merged: BestScores = { ...b };
      for (const d of DIFFICULTY_LIST) {
        const v = incoming[d];
        if (v !== undefined && v > (merged[d] ?? 0)) merged[d] = v;
      }
      return merged;
    });
  }, []);
  const newGame = useCallback((difficulty: Difficulty) => {
    setNewRecord(false);
    dispatch({ type: "NEW_GAME", difficulty });
  }, []);

  return {
    state,
    best,
    newRecord,
    flip,
    newGame,
    mergeBest,
    pause: () => dispatch({ type: "PAUSE" }),
    resume: () => dispatch({ type: "RESUME" }),
  };
}
