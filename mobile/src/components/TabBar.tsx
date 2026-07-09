import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from './Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { spacing, radius, shadow } from '../theme/spacing';

export interface TabItem {
  name: string; // route name (file name without extension)
  label: string;
  icon: IconName;
}

interface Props extends BottomTabBarProps {
  items: TabItem[];
  accent?: string;
  accentSoft?: string;
}

/** Custom bottom navigation matching the design: pill-highlighted active tab. */
export function TabBar({ state, navigation, items, accent = colors.blue, accentSoft = colors.blueSoft }: Props) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {items.map((item) => {
        const focused = item.name === activeName;
        const route = state.routes.find((r) => r.name === item.name);
        const onPress = () => {
          if (!route) return;
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
        };
        return (
          <Pressable
            key={item.name}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
          >
            <View style={[styles.pill, focused && { backgroundColor: accentSoft }]}>
              <Icon name={item.icon} size={22} color={focused ? accent : colors.textFaint} />
            </View>
            <Text style={[styles.label, { color: focused ? accent : colors.textFaint }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadow.bar,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: {
    minWidth: 56,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.medium, fontSize: 11 },
});
