import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing, shadow } from '../theme/spacing';

interface Props {
  label: string;
  value: string | number;
  icon?: string;
  accent?: string;
}

export function StatCard({ label, value, icon, accent = colors.blue }: Props) {
  return (
    <View style={styles.card}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 92,
    justifyContent: 'center',
    ...shadow.card,
  },
  icon: { fontSize: 20, marginBottom: spacing.xs },
  value: { fontSize: 26, fontWeight: '800' },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
});
