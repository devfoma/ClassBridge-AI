import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface Props {
  title: string;
  instructions?: string | null;
  questionCount: number;
  downloaded?: boolean;
  onPress?: () => void;
  footer?: React.ReactNode;
  accent?: string;
}

export function AssignmentCard({
  title,
  instructions,
  questionCount,
  downloaded,
  onPress,
  footer,
  accent = colors.blue,
}: Props) {
  return (
    <AppCard onPress={onPress} accent={accent}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>📝</Text>
        <View style={styles.flex}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>
            {questionCount} question{questionCount === 1 ? '' : 's'}
            {downloaded != null ? (downloaded ? ' · Downloaded' : ' · Not downloaded') : ''}
          </Text>
        </View>
      </View>
      {instructions ? (
        <Text style={styles.instructions} numberOfLines={2}>
          {instructions}
        </Text>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  icon: { fontSize: 22, marginRight: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  instructions: { fontSize: 14, color: colors.text, marginTop: spacing.sm, lineHeight: 20 },
  footer: { marginTop: spacing.md },
});
