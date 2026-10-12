import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DIFFICULTIES, formatTime, type BestScores, type GameState, type Palette } from '@memory/core';
import type { T } from '../hooks/useSettings';

interface Props {
  state: GameState;
  best: BestScores;
  palette: Palette;
  t: T;
}

export function Stats({ state, best, palette, t }: Props) {
  const { moveLimit, timeLimit } = DIFFICULTIES[state.difficulty];
  const playing = state.status === 'playing';
  const items = [
    { label: t('moves'), value: `${state.moves}/${moveLimit}`, warn: playing && moveLimit - state.moves <= 3 },
    { label: t('time'), value: formatTime(state.timeLeft), warn: playing && state.timeLeft <= 10 },
    { label: t('points'), value: String(state.matched.length * 100), warn: false },
    { label: t('best'), value: String(best[state.difficulty] ?? 0), warn: false },
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {items.map(it => (
          <View key={it.label} style={[styles.stat, { backgroundColor: palette.surfaceAlt }]}>
            <Text style={[styles.label, { color: palette.textMuted }]}>{it.label}</Text>
            <Text style={[styles.value, { color: it.warn ? palette.danger : palette.text }]}>{it.value}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.track, { backgroundColor: palette.surfaceAlt }]}>
        <View style={[styles.bar, { backgroundColor: palette.primary, width: `${(state.timeLeft / timeLimit) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexGrow: 1, flexBasis: '45%', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 13 },
  value: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%' },
});
