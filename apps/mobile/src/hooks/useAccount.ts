import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  type ApiUser,
  type AuthResponse,
  type BestScores,
  type GameState,
  type Settings,
} from '@memory/core';
import { api, getToken, setToken } from '../api';
import type { T } from './useSettings';

export function errorText(e: unknown, t: T): string {
  if (e instanceof ApiError) {
    return e.code === 'invalid_nickname' ? t('invalidNickname') : t('genericError');
  }
  return t('offlineError');
}

interface Options {
  settings: Settings;
  onSettings: (s: Settings) => void;
  onBest: (best: BestScores) => void;
}

export function useAccount({ settings, onSettings, onBest }: Options) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const lastSettings = useRef('');

  const adopt = useCallback(
    (u: ApiUser) => {
      setUser(u);
      onBest(u.best);
      if (u.settings) {
        lastSettings.current = JSON.stringify(u.settings);
        onSettings(u.settings);
      }
    },
    [onBest, onSettings],
  );

  useEffect(() => {
    if (!api.enabled) {
      return;
    }
    getToken().then(token => {
      if (!token) {
        return;
      }
      api
        .me()
        .then(adopt)
        .catch(e => {
          if (e instanceof ApiError && e.status === 401) {
            setToken(null);
          }
        });
    });
  }, [adopt]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const json = JSON.stringify(settings);
    if (json === lastSettings.current) {
      return;
    }
    const id = setTimeout(() => {
      lastSettings.current = json;
      api.updateMe({ settings }).catch(() => undefined);
    }, 1000);
    return () => clearTimeout(id);
  }, [settings, user]);

  const finish = useCallback(
    async (res: AuthResponse) => {
      await setToken(res.token);
      adopt(res.user);
    },
    [adopt],
  );

  return {
    user,
    enabled: api.enabled,
    signInGuest: async (nickname: string) => finish(await api.guest(nickname)),
    signInGoogle: async (idToken: string) => finish(await api.google(idToken)),
    rename: async (nickname: string) => setUser(await api.updateMe({ nickname })),
    signOut: async () => {
      try {
        await api.logout();
      } catch {
        /* token may already be invalid */
      }
      await setToken(null);
      setUser(null);
    },
    submitScore: async (state: GameState) => {
      if (!user) {
        return;
      }
      try {
        const res = await api.submitScore({
          difficulty: state.difficulty,
          moves: state.moves,
          timeLeft: state.timeLeft,
        });
        onBest(res.best);
      } catch {
        /* offline: the local record is still kept */
      }
    },
  };
}
