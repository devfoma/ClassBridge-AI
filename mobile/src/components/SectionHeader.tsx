import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { text as t } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Uppercase section overline with an optional right-aligned text action. */
export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable hitSlop={8} onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: { ...t.overline, color: colors.navy },
  action: { ...t.labelMd, color: colors.blue, fontFamily: 'Inter_600SemiBold' },
});
