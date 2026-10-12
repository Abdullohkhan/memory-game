import { DEFAULT_SETTINGS } from "./config";
import { isLanguage } from "./i18n";
import { bestKey } from "./game";
import type { BestScores, Difficulty, Settings, ThemeMode } from "./types";

/** Minimal async key-value store so web (localStorage) and mobile (AsyncStorage) share logic. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const SETTINGS_KEY = "memory.settings";

function isTheme(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function parseSettings(raw: string | null, fallbackLanguage = DEFAULT_SETTINGS.language): Settings {
  const defaults: Settings = { ...DEFAULT_SETTINGS, language: fallbackLanguage };
  if (!raw) return defaults;
  try {
    const data = JSON.parse(raw) as Partial<Settings>;
    return {
      language: isLanguage(data.language) ? data.language : defaults.language,
      theme: isTheme(data.theme) ? data.theme : defaults.theme,
      symbols: typeof data.symbols === "boolean" ? data.symbols : defaults.symbols,
      sound: typeof data.sound === "boolean" ? data.sound : defaults.sound,
    };
  } catch {
    return defaults;
  }
}

export async function loadSettings(store: KeyValueStore, fallbackLanguage?: Settings["language"]): Promise<Settings> {
  try {
    return parseSettings(await store.getItem(SETTINGS_KEY), fallbackLanguage);
  } catch {
    return parseSettings(null, fallbackLanguage);
  }
}

export async function saveSettings(store: KeyValueStore, settings: Settings): Promise<void> {
  try {
    await store.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable (private mode, quota) – settings just won't persist */
  }
}

export async function loadBest(store: KeyValueStore, difficulties: Difficulty[]): Promise<BestScores> {
  const out: BestScores = {};
  for (const d of difficulties) {
    try {
      const n = Number(await store.getItem(bestKey(d)));
      if (Number.isFinite(n) && n > 0) out[d] = n;
    } catch {
      /* ignore */
    }
  }
  return out;
}

export async function saveBest(store: KeyValueStore, difficulty: Difficulty, points: number): Promise<void> {
  try {
    await store.setItem(bestKey(difficulty), String(points));
  } catch {
    /* ignore */
  }
}
