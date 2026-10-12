import { LANGUAGES, type Settings as SettingsData, type ThemeMode } from "@memory/core";
import type { T } from "../hooks/useSettings";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  settings: SettingsData;
  t: T;
  onChange: (patch: Partial<SettingsData>) => void;
  onClose: () => void;
}

export function Settings({ open, settings, t, onChange, onClose }: Props) {
  const themes: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t("themeSystem") },
    { value: "light", label: t("themeLight") },
    { value: "dark", label: t("themeDark") },
  ];
  return (
    <Modal open={open} onClose={onClose} label={t("settings")}>
      <h2>{t("settings")}</h2>

      <fieldset>
        <legend>{t("language")}</legend>
        <div className="segmented">
          {LANGUAGES.map((l) => (
            <button key={l.code} type="button" aria-pressed={settings.language === l.code} onClick={() => onChange({ language: l.code })}>
              {l.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>{t("theme")}</legend>
        <div className="segmented">
          {themes.map((th) => (
            <button key={th.value} type="button" aria-pressed={settings.theme === th.value} onClick={() => onChange({ theme: th.value })}>
              {th.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="switch-row">
        <span>
          {t("symbols")}
          <small>{t("symbolsHint")}</small>
        </span>
        <input type="checkbox" role="switch" checked={settings.symbols} onChange={(e) => onChange({ symbols: e.target.checked })} />
      </label>

      <label className="switch-row">
        <span>{t("sound")}</span>
        <input type="checkbox" role="switch" checked={settings.sound} onChange={(e) => onChange({ sound: e.target.checked })} />
      </label>

      <button type="button" className="btn btn-primary" onClick={onClose}>
        {t("close")}
      </button>
    </Modal>
  );
}
