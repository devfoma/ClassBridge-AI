import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

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
        <View style={[styles.iconTile, { backgroundColor: colors.blueSoft }]}>
          <Icon name="quiz" size={20} color={colors.blue} />
        </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  iconTile: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  instructions: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: spacing.md, lineHeight: 20 },
  footer: { marginTop: spacing.md },
});
