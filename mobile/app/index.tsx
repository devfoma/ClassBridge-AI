import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { RoleCard } from '../src/components/RoleCard';
import { TextField } from '../src/components/TextField';
import { useAuthStore } from '../src/state/useAuthStore';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { UserRole } from '../src/types/user';

export default function RoleSelection() {
  const { user, selectRole } = useAuthStore();
  const [name, setName] = React.useState('');

  // App launch logic: if a profile already exists, route straight to its dashboard.
  useEffect(() => {
    if (user) {
      router.replace(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    }
  }, [user]);

  const onChoose = async (role: UserRole) => {
    await selectRole(role, name);
    router.replace(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>C3</Text>
        <Text style={styles.title}>ClassBridge AI</Text>
        <Text style={styles.subtitle}>
          A Gemma-powered offline classroom for low-connectivity schools.
        </Text>
      </View>

      <TextField
        label="Your name (optional)"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Mrs. Okoye or Ada"
        autoCapitalize="words"
      />

      <Text style={styles.pick}>Choose your role</Text>

      <RoleCard
        icon="👩🏽‍🏫"
        title="Teacher"
        subtitle="Create classes, import lessons, generate quizzes with Gemma and review student work."
        accent={colors.teacher}
        accentSoft={colors.teacherSoft}
        onPress={() => onChoose('teacher')}
      />
      <RoleCard
        icon="🧑🏽‍🎓"
        title="Student"
        subtitle="Join a class, download lessons, and complete quizzes offline — sync when connected."
        accent={colors.student}
        accentSoft={colors.studentSoft}
        onPress={() => onChoose('student')}
      />

      <Text style={styles.footer}>
        No sign-up needed. Your data stays on your device and the local school hub.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.navy,
    letterSpacing: 2,
    backgroundColor: colors.blueSoft,
    width: 84,
    height: 84,
    borderRadius: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 84,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: '900', color: colors.navy },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
    paddingHorizontal: spacing.md,
  },
  pick: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.md },
  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 17,
  },
});
