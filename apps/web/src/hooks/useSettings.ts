import { useCallback, useEffect, useState } from "react";
import { SETTINGS_KEY, detectLanguage, paletteFor, parseSettings, resolveScheme, translate, type Settings, type TranslationKey } from "@memory/core";

function readInitial(): Settings {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SETTINGS_KEY);
  } catch {
    /* storage blocked */
  }
  return parseSettings(raw, detectLanguage(navigator.language));
}

function useSystemDark(): boolean {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(readInitial);
  const systemDark = useSystemDark();
  const scheme = resolveScheme(settings.theme, systemDark);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = scheme;
    root.style.colorScheme = scheme;
    for (const [name, value] of Object.entries(paletteFor(scheme))) {
      root.style.setProperty(`--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, value);
    }
    document.documentElement.lang = settings.language;
    document.title = `${translate(settings.language, "title")} | Abdulmajid`;
  }, [scheme, settings.language]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const t = useCallback((key: TranslationKey) => translate(settings.language, key), [settings.language]);

  return { settings, update, t };
}

export type T = ReturnType<typeof useSettings>["t"];
