import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  DEFAULT_SETTINGS,
  detectLanguage,
  loadSettings,
  paletteFor,
  resolveScheme,
  saveSettings,
  translate,
  type Palette,
  type Settings,
  type TranslationKey,
} from '@memory/core';
import { store } from '../storage';

export function useSettings() {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    language: detectLanguage(Intl.DateTimeFormat().resolvedOptions().locale),
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadSettings(store, settings.language).then(s => {
      if (active) {
        setSettings(s);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const update = useCallback(
    (patch: Partial<Settings>) =>
      setSettings(prev => {
        const next = { ...prev, ...patch };
        saveSettings(store, next);
        return next;
      }),
    [],
  );

  const scheme = resolveScheme(settings.theme, systemScheme === 'dark');
  const palette: Palette = paletteFor(scheme);
  const t = useCallback((key: TranslationKey) => translate(settings.language, key), [settings.language]);

  return { settings, update, t, palette, scheme, loaded };
}

export type T = ReturnType<typeof useSettings>['t'];
