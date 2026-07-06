import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function TeacherLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Teacher', headerShown: false }} />
      <Stack.Screen name="classrooms" options={{ title: 'Classrooms' }} />
      <Stack.Screen name="classroom-detail" options={{ title: 'Class' }} />
      <Stack.Screen name="library" options={{ title: 'Library' }} />
      <Stack.Screen name="upload-resource" options={{ title: 'Upload Resource' }} />
      <Stack.Screen name="assignment-create" options={{ title: 'Create Assignment' }} />
      <Stack.Screen name="submissions" options={{ title: 'Submissions' }} />
      <Stack.Screen name="insights" options={{ title: 'AI Insights' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
