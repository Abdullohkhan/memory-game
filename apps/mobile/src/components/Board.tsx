import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DIFFICULTIES, isCardFaceUp, type GameState, type Palette } from '@memory/core';
import type { T } from '../hooks/useSettings';
import { Card } from './Card';

const GAP = 10;

interface Props {
  state: GameState;
  /** space available for the board */
  width: number;
  height: number;
  landscape: boolean;
  showSymbols: boolean;
  palette: Palette;
  t: T;
  onFlip: (index: number) => void;
  onResume: () => void;
}

export function Board({ state, width, height, landscape, showSymbols, palette, t, onFlip, onResume }: Props) {
  const cfg = DIFFICULTIES[state.difficulty];
  const cols = landscape ? cfg.columns.landscape : cfg.columns.portrait;
  const rows = Math.ceil(state.deck.length / cols);
  const size = Math.max(
    40,
    Math.floor(Math.min((width - GAP * (cols - 1)) / cols, (height - GAP * (rows - 1)) / rows)),
  );
  const paused = state.status === 'paused';
  const locked = state.resolving || state.status === 'won' || state.status === 'lost' || paused;

  return (
    <View style={{ width: size * cols + GAP * (cols - 1) }}>
      <View style={styles.grid}>
        {state.deck.map((card, index) => {
          const faceUp = isCardFaceUp(state, index);
          const matched = state.matched.includes(card.pairId);
          const status = faceUp ? (matched ? t('matchedCard') : card.symbol) : t('faceDown');
          return (
            <Card
              key={card.id}
              card={card}
              index={index}
              size={size}
              faceUp={faceUp}
              matched={matched}
              showSymbol={showSymbols}
              disabled={locked}
              palette={palette}
              label={`${t('card')} ${index + 1}: ${status}`}
              onFlip={onFlip}
            />
          );
        })}
      </View>
      {paused && (
        <Pressable
          style={[styles.pause, { backgroundColor: palette.background, borderRadius: 14 }]}
          onPress={onResume}
          accessibilityRole="button"
          accessibilityLabel={t('resume')}
        >
          <Text style={[styles.pauseTitle, { color: palette.text }]}>⏸ {t('paused')}</Text>
          <Text style={{ color: palette.textMuted }}>{t('resume')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  pause: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.97 },
  pauseTitle: { fontSize: 24, fontWeight: '800' },
});
