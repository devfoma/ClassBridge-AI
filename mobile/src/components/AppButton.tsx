import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { radius, spacing, shadow } from '../theme/spacing';

type Variant = 'primary' | 'navy' | 'secondary' | 'success' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  /** Overrides the fill/outline colour for primary & secondary variants. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  accent,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const solidBg: Record<string, string> = {
    primary: accent ?? colors.blue,
    navy: colors.navy,
    success: colors.success,
    danger: colors.danger,
  };
  const outlined = variant === 'secondary' || variant === 'ghost';
  const outlineColor = variant === 'ghost' ? colors.outlineVariant : accent ?? colors.blue;
  const bg = outlined ? colors.card : solidBg[variant];
  const textColor = outlined
    ? variant === 'ghost'
      ? colors.textMuted
      : accent ?? colors.blue
    : colors.textInverse;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        outlined && { borderWidth: 1.5, borderColor: outlineColor },
        !outlined && shadow.button,
        !outlined && { shadowColor: solidBg[variant] },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.inner}>
          {icon ? <Icon name={icon} size={19} color={textColor} /> : null}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { fontFamily: fonts.bold, fontSize: 16 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
