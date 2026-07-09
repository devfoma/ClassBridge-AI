import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface Props {
  label: string;
  /** Foreground (text/icon) colour; background is derived at low opacity. */
  color?: string;
  bg?: string;
  icon?: IconName;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Low-saturation status pill: soft background, high-saturation text. */
export function Chip({ label, color = colors.blue, bg, icon, dot, style }: Props) {
  return (
    <View style={[styles.chip, { backgroundColor: bg ?? colors.blueSoft }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      {icon ? <Icon name={icon} size={13} color={color} style={styles.icon} /> : null}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  icon: { marginRight: 4 },
  text: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.2 },
});
