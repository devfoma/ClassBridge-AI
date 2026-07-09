import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { radius, spacing, shadow } from '../theme/spacing';

interface Props {
  icon: IconName;
  title: string;
  subtitle: string;
  cta: string;
  accent: string;
  accentSoft: string;
  onPress: () => void;
}

export function RoleCard({ icon, title, subtitle, cta, accent, accentSoft, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
        <Icon name={icon} size={30} color={accent} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: accent }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={[styles.cta, { color: accent }]}>{cta} →</Text>
      </View>
      <Icon name="chevron" size={22} color={colors.outlineVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadow.card,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: '22%',
    bottom: '22%',
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  pressed: { opacity: 0.95, transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 20, marginBottom: 2 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  cta: { fontFamily: fonts.semibold, fontSize: 12, marginTop: spacing.sm },
});
