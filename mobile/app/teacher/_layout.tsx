import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar, TabItem } from '../../src/components/TabBar';
import { colors } from '../../src/theme/colors';

const TABS: TabItem[] = [
  { name: 'dashboard', label: 'Home', icon: 'dashboard' },
  { name: 'library', label: 'Library', icon: 'library' },
  { name: 'submissions', label: 'Grades', icon: 'submissions' },
  { name: 'settings', label: 'Settings', icon: 'settings' },
];

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar {...props} items={TABS} accent={colors.teacher} accentSoft={colors.teacherSoft} />
      )}
    />
  );
}
