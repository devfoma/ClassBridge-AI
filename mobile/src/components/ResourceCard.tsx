import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface Props {
  title: string;
  subject?: string | null;
  level?: string | null;
  summary?: string | null;
  onPress?: () => void;
  right?: React.ReactNode;
}

export function ResourceCard({ title, subject, level, summary, onPress, right }: Props) {
  return (
    <AppCard onPress={onPress} accent={colors.navy}>
      <View style={styles.row}>
        <Text style={styles.icon}>📄</Text>
        <View style={styles.flex}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>
            {[subject, level].filter(Boolean).join(' · ') || 'Text resource'}
          </Text>
        </View>
        {right}
      </View>
      {summary ? (
        <Text style={styles.summary} numberOfLines={3}>
          {summary}
        </Text>
      ) : (
        <View style={styles.pendingPill}>
          <Text style={styles.pendingText}>No AI summary yet</Text>
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  icon: { fontSize: 24, marginRight: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  summary: { fontSize: 14, color: colors.text, marginTop: spacing.md, lineHeight: 20 },
  pendingPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingText: { fontSize: 12, color: colors.warning, fontWeight: '600' },
});
