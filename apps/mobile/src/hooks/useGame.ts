import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import {
  DIFFICULTY_LIST,
  MISMATCH_DELAY_MS,
  createGame,
  gameReducer,
  loadBest,
  nextBest,
  saveBest,
  type BestScores,
  type Difficulty,
} from '@memory/core';
import { store } from '../storage';

function mergeMax(a: BestScores, b: BestScores): BestScores {
  const out: BestScores = { ...a };
  for (const d of DIFFICULTY_LIST) {
    const v = b[d];
    if (v !== undefined && v > (out[d] ?? 0)) {
      out[d] = v;
    }
  }
  return out;
}

export function useGame(vibrate: boolean) {
  const [state, dispatch] = useReducer(gameReducer, 'easy' as Difficulty, d => createGame(d));
  const [best, setBest] = useState<BestScores>({});
  const [newRecord, setNewRecord] = useState(false);

  useEffect(() => {
    loadBest(store, DIFFICULTY_LIST).then(loaded => setBest(b => mergeMax(b, loaded)));
  }, []);

  useEffect(() => {
    if (state.status !== 'playing') {
      return;
    }
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (!state.resolving) {
      return;
    }
    const id = setTimeout(() => dispatch({ type: 'RESOLVE' }), MISMATCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [state.resolving]);

  // record keeping when the game transitions to "won" (adjusted during render)
  const [seenStatus, setSeenStatus] = useState(state.status);
  if (seenStatus !== state.status) {
    setSeenStatus(state.status);
    if (state.status === 'won') {
      const improved = state.points > (best[state.difficulty] ?? 0);
      setNewRecord(improved);
      if (improved) {
        setBest({ ...best, [state.difficulty]: nextBest(best[state.difficulty], state.points) });
      }
    }
  }
  const savedBest = useRef(best);
  useEffect(() => {
    for (const d of DIFFICULTY_LIST) {
      const value = best[d];
      if (value !== undefined && value !== savedBest.current[d]) {
        saveBest(store, d, value);
      }
    }
    savedBest.current = best;
  }, [best]);

  // haptics
  const prev = useRef(state);
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (!vibrate) {
      return;
    }
    if (state.matched.length > p.matched.length) {
      Vibration.vibrate(state.status === 'won' ? [0, 60, 60, 120] : 30);
    } else if (state.resolving && !p.resolving) {
      Vibration.vibrate(80);
    } else if (state.status === 'lost' && p.status !== 'lost') {
      Vibration.vibrate(250);
    }
  }, [state, vibrate]);

  const flip = useCallback((index: number) => dispatch({ type: 'FLIP', index }), []);
  const mergeBest = useCallback((incoming: BestScores) => setBest(b => mergeMax(b, incoming)), []);
  const newGame = useCallback((difficulty: Difficulty) => {
    setNewRecord(false);
    dispatch({ type: 'NEW_GAME', difficulty });
  }, []);

  return {
    state,
    best,
    newRecord,
    flip,
    newGame,
    mergeBest,
    pause: () => dispatch({ type: 'PAUSE' }),
    resume: () => dispatch({ type: 'RESUME' }),
  };
}
