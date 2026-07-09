import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

interface Props {
  /** 0–1 progress fraction. */
  value: number;
  color?: string;
  track?: string;
  height?: number;
}

export function ProgressBar({ value, color = colors.blue, track = colors.surface2, height = 10 }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { backgroundColor: track, height, borderRadius: height / 2 }]}>
      <View
        style={[styles.fill, { backgroundColor: color, width: `${pct}%`, borderRadius: height / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%', minWidth: 4, borderRadius: radius.pill },
});
