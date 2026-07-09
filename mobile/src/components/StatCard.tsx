import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { radius, spacing, shadow } from '../theme/spacing';

interface Props {
  label: string;
  value: string | number;
  icon?: IconName;
  accent?: string;
  accentSoft?: string;
}

export function StatCard({ label, value, icon, accent = colors.blue, accentSoft = colors.blueSoft }: Props) {
  return (
    <View style={styles.card}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
          <Icon name={icon} size={18} color={accent} />
        </View>
      ) : null}
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 108,
    justifyContent: 'center',
    ...shadow.card,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: { fontFamily: fonts.extrabold, fontSize: 26 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
