import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from '@memory/core';

interface SegmentedProps<V extends string> {
  options: { value: V; label: string }[];
  value: V;
  palette: Palette;
  onChange: (value: V) => void;
}

export function Segmented<V extends string>({ options, value, palette, onChange }: SegmentedProps<V>) {
  return (
    <View style={[styles.segmented, { backgroundColor: palette.surfaceAlt }]}>
      {options.map(o => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && { backgroundColor: palette.primary }]}
          >
            <Text style={[styles.segmentText, { color: selected ? palette.primaryText : palette.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ButtonProps {
  label: string;
  palette: Palette;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function Button({ label, palette, primary, disabled, onPress }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: primary ? palette.primary : palette.surfaceAlt, borderColor: palette.border, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? palette.primaryText : palette.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', padding: 4, borderRadius: 12, gap: 4 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: 4 },
  segmentText: { fontWeight: '600', fontSize: 15 },
  button: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
  buttonText: { fontWeight: '700', fontSize: 16 },
});
