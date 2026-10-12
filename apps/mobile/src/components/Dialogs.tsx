import React from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { LANGUAGES, type GameState, type Palette, type Settings, type ThemeMode } from '@memory/core';
import type { T } from '../hooks/useSettings';
import { Button, Segmented } from './ui';

export function Sheet({ visible, palette, onClose, children }: { visible: boolean; palette: Palette; onClose?: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: palette.surface }]} onPress={() => {}}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface SettingsProps {
  visible: boolean;
  settings: Settings;
  palette: Palette;
  t: T;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

export function SettingsDialog({ visible, settings, palette, t, onChange, onClose }: SettingsProps) {
  const themes: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('themeSystem') },
    { value: 'light', label: t('themeLight') },
    { value: 'dark', label: t('themeDark') },
  ];
  return (
    <Sheet visible={visible} palette={palette} onClose={onClose}>
      <Text style={[styles.title, { color: palette.text }]}>{t('settings')}</Text>
      <Text style={[styles.legend, { color: palette.text }]}>{t('language')}</Text>
      <Segmented
        options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
        value={settings.language}
        palette={palette}
        onChange={language => onChange({ language })}
      />
      <Text style={[styles.legend, { color: palette.text }]}>{t('theme')}</Text>
      <Segmented options={themes} value={settings.theme} palette={palette} onChange={theme => onChange({ theme })} />
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: palette.text }]}>{t('symbols')}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13 }}>{t('symbolsHint')}</Text>
        </View>
        <Switch value={settings.symbols} onValueChange={symbols => onChange({ symbols })} trackColor={{ true: palette.primary }} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.rowLabel, { color: palette.text }]}>{t('sound')}</Text>
        <Switch value={settings.sound} onValueChange={sound => onChange({ sound })} trackColor={{ true: palette.primary }} />
      </View>
      <View style={styles.buttons}>
        <Button label={t('close')} palette={palette} primary onPress={onClose} />
      </View>
    </Sheet>
  );
}

interface ResultProps {
  state: GameState;
  newRecord: boolean;
  palette: Palette;
  t: T;
  onPlayAgain: () => void;
}

export function ResultDialog({ state, newRecord, palette, t, onPlayAgain }: ResultProps) {
  const won = state.status === 'won';
  const visible = won || state.status === 'lost';
  return (
    <Sheet visible={visible} palette={palette}>
      <Text style={[styles.title, { color: won ? palette.success : palette.danger, textAlign: 'center' }]}>{won ? t('win') : t('lose')}</Text>
      {won && (
        <>
          <Text style={[styles.center, { color: palette.text }]}>
            {t('yourPoints')}: <Text style={styles.bold}>{state.points}</Text>
          </Text>
          {newRecord && <Text style={[styles.center, styles.bold, { color: palette.primary }]}>🏆 {t('newRecord')}</Text>}
        </>
      )}
      <View style={styles.buttons}>
        <Button label={t('playAgain')} palette={palette} primary onPress={onPlayAgain} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 420, borderRadius: 18, padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  legend: { fontWeight: '700', fontSize: 14, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '600' },
  buttons: { flexDirection: 'row', marginTop: 6 },
  center: { textAlign: 'center', fontSize: 17 },
  bold: { fontWeight: '800' },
});
