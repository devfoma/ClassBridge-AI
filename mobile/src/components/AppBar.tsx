import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { colors, roleAccent } from '../theme/colors';
import { fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface Props {
  title: string;
  role?: 'teacher' | 'student';
  /** Show a brand mark + wordmark on the left (dashboards). */
  brand?: boolean;
  /** Show a back button on the left (detail screens). */
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}

/** Fixed top app-bar. `brand` renders the ClassBridge mark; otherwise a title. */
export function AppBar({ title, role, brand, back, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  const { accent, accentSoft } = roleAccent(role);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <View style={styles.left}>
          {back ? (
            <Pressable
              hitSlop={8}
              onPress={onBack ?? (() => router.back())}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Icon name="back" size={24} color={colors.text} />
            </Pressable>
          ) : brand ? (
            <View style={[styles.mark, { backgroundColor: accentSoft }]}>
              <Icon name="school" size={20} color={accent} />
            </View>
          ) : null}
          <Text style={[styles.title, brand && styles.brandTitle]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

/** A round icon button for the app-bar's right slot. */
export function AppBarAction({
  name,
  onPress,
  color = colors.textMuted,
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Icon name={name} size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    marginLeft: -8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 18, color: colors.navy, flexShrink: 1 },
  brandTitle: { letterSpacing: -0.2 },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
