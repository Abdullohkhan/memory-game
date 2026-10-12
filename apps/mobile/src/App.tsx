import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DIFFICULTY_LIST } from '@memory/core';
import { Board } from './components/Board';
import { ResultDialog, SettingsDialog } from './components/Dialogs';
import { Stats } from './components/Stats';
import { Button, Segmented } from './components/ui';
import { useGame } from './hooks/useGame';
import { useSettings } from './hooks/useSettings';

function Game() {
  const { settings, update, t, palette, scheme } = useSettings();
  const { state, best, newRecord, flip, newGame, pause, resume } = useGame(settings.sound);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const landscape = width > height;
  const panelWidth = landscape ? Math.min(360, width * 0.4) : Math.min(width - 32, 640);
  const innerWidth = width - insets.left - insets.right;
  const innerHeight = height - insets.top - insets.bottom;
  const boardWidth = landscape ? innerWidth - panelWidth - 48 : Math.min(innerWidth - 32, 640);
  const boardHeight = landscape ? innerHeight - 24 : Math.max(220, innerHeight - 340);

  const panel = (
    <View style={[styles.panel, { width: panelWidth, backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Segmented
        options={DIFFICULTY_LIST.map(d => ({ value: d, label: t(d) }))}
        value={state.difficulty}
        palette={palette}
        onChange={newGame}
      />
      <Stats state={state} best={best} palette={palette} t={t} />
      {state.status === 'idle' && <Text style={[styles.hint, { color: palette.textMuted }]}>{t('tapToStart')}</Text>}
      <View style={styles.actions}>
        <Button
          label={state.status === 'paused' ? t('resume') : t('pause')}
          palette={palette}
          disabled={state.status !== 'playing' && state.status !== 'paused'}
          onPress={state.status === 'paused' ? resume : pause}
        />
        <Button label={t('newGame')} palette={palette} primary onPress={() => newGame(state.difficulty)} />
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
          {t('title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings')}
          onPress={() => setSettingsOpen(true)}
          style={[styles.iconBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
        >
          <Text style={{ fontSize: 22, color: palette.text }}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, landscape && styles.contentLandscape]}
        scrollEnabled={!landscape}
      >
        {panel}
        <Board
          state={state}
          width={boardWidth}
          height={boardHeight}
          landscape={landscape}
          showSymbols={settings.symbols}
          palette={palette}
          t={t}
          onFlip={flip}
          onResume={resume}
        />
      </ScrollView>

      <SettingsDialog visible={settingsOpen} settings={settings} palette={palette} t={t} onChange={update} onClose={() => setSettingsOpen(false)} />
      <ResultDialog state={state} newRecord={newRecord} palette={palette} t={t} onPlayAgain={() => newGame(state.difficulty)} />
    </View>
  );
}

export function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 14, padding: 16, paddingTop: 4 },
  contentLandscape: { flexGrow: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 },
  panel: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  hint: { textAlign: 'center', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8 },
});
