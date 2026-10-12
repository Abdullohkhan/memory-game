import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import type { Card as CardData, Palette } from '@memory/core';

interface Props {
  card: CardData;
  index: number;
  size: number;
  faceUp: boolean;
  matched: boolean;
  showSymbol: boolean;
  disabled: boolean;
  label: string;
  palette: Palette;
  onFlip: (index: number) => void;
}

export const Card = memo(function Card({
  card,
  index,
  size,
  faceUp,
  matched,
  showSymbol,
  disabled,
  label,
  palette,
  onFlip,
}: Props) {
  const progress = useRef(new Animated.Value(faceUp ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: faceUp ? 1 : 0, duration: 350, useNativeDriver: true }).start();
  }, [faceUp, progress]);

  const rotateBack = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotateFront = progress.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const radius = Math.max(8, size * 0.14);
  const base = { width: size, height: size, borderRadius: radius };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || faceUp }}
      disabled={disabled || faceUp}
      onPress={() => onFlip(index)}
      style={base}
    >
      <Animated.View
        style={[
          styles.face,
          base,
          { backgroundColor: palette.cardBack, borderColor: palette.cardBackAccent, transform: [{ perspective: 800 }, { rotateY: rotateBack }] },
        ]}
      >
        <Text style={[styles.mark, { fontSize: size * 0.4 }]}>?</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.face,
          base,
          matched && { borderColor: palette.success, borderWidth: 3 },
          { backgroundColor: card.color, transform: [{ perspective: 800 }, { rotateY: rotateFront }] },
        ]}
      >
        {showSymbol && <Text style={[styles.symbol, { fontSize: size * 0.45 }]}>{card.symbol}</Text>}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 3,
  },
  mark: { color: 'rgba(255,255,255,0.75)', fontWeight: '800' },
  symbol: { color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
});
