import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing, shadow } from '../theme/spacing';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Draws a 4px contextual accent bar down the left edge. */
  accent?: string;
  /** Elevate with a soft ambient shadow (hero/primary cards). */
  elevated?: boolean;
}

export function AppCard({ children, onPress, style, accent, elevated = true }: Props) {
  const content = (
    <View style={[styles.card, elevated && shadow.card, style]}>
      {accent ? <View style={[styles.accentBar, { backgroundColor: accent }]} /> : null}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
