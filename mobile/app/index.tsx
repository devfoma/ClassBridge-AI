import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { RoleCard } from '../src/components/RoleCard';
import { TextField } from '../src/components/TextField';
import { Chip } from '../src/components/Chip';
import { useAuthStore } from '../src/state/useAuthStore';
import { colors } from '../src/theme/colors';
import { fonts, text as t } from '../src/theme/typography';
import { spacing, radius, shadow } from '../src/theme/spacing';
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
        <View style={styles.logoWrap}>
          <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Start your classroom session</Text>
        <Text style={styles.subtitle}>Choose your bridge to the offline digital learning environment.</Text>
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
        icon="school"
        title="Teacher"
        subtitle="Create classes, import lessons, generate quizzes with Gemma and review student work."
        cta="Enter classroom"
        accent={colors.teacher}
        accentSoft={colors.teacherSoft}
        onPress={() => onChoose('teacher')}
      />
      <RoleCard
        icon="person"
        title="Student"
        subtitle="Join a class, download lessons, and complete quizzes offline — sync when connected."
        cta="Join a lesson"
        accent={colors.student}
        accentSoft={colors.studentSoft}
        onPress={() => onChoose('student')}
      />

      <View style={styles.footer}>
        <Chip label="OFFLINE-FIRST CLASSROOM" icon="offline" color={colors.navy} bg={colors.surface2} />
        <Text style={styles.footerNote}>
          No sign-up needed. Your data stays on your device and the local school hub.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingHorizontal: spacing.screen },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  logo: { width: 60, height: 60 },
  title: { ...t.headlineLgMobile, textAlign: 'center' },
  subtitle: {
    ...t.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pick: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  footer: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.md },
  footerNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.lg,
  },
});
