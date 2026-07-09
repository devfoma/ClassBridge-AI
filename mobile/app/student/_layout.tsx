import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar, TabItem } from '../../src/components/TabBar';
import { colors } from '../../src/theme/colors';

const TABS: TabItem[] = [
  { name: 'dashboard', label: 'Home', icon: 'dashboard' },
  { name: 'lessons', label: 'Lessons', icon: 'lessons' },
  { name: 'sync', label: 'Sync', icon: 'sync' },
  { name: 'settings', label: 'Settings', icon: 'settings' },
];

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar {...props} items={TABS} accent={colors.student} accentSoft={colors.studentSoft} />
      )}
    />
  );
}
