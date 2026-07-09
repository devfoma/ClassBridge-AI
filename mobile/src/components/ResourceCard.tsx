import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

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
        <View style={[styles.iconTile, { backgroundColor: colors.navySoft }]}>
          <Icon name="resource" size={20} color={colors.navy} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{[subject, level].filter(Boolean).join(' · ') || 'Text resource'}</Text>
        </View>
        {right}
      </View>
      {summary ? (
        <Text style={styles.summary} numberOfLines={3}>
          {summary}
        </Text>
      ) : (
        <Chip
          label="No AI summary yet"
          color={colors.warning}
          bg={colors.warningSoft}
          icon="ai"
          style={styles.pending}
        />
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  iconTile: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  summary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: spacing.md, lineHeight: 20 },
  pending: { marginTop: spacing.md },
});
