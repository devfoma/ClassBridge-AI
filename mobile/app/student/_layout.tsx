import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function StudentLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.blue },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Student', headerShown: false }} />
      <Stack.Screen name="join-class" options={{ title: 'Join a Class' }} />
      <Stack.Screen name="lessons" options={{ title: 'My Lessons' }} />
      <Stack.Screen name="lesson-detail" options={{ title: 'Lesson' }} />
      <Stack.Screen name="quiz" options={{ title: 'Quiz' }} />
      <Stack.Screen name="sync" options={{ title: 'Sync Center' }} />
      <Stack.Screen name="feedback" options={{ title: 'My Feedback' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
