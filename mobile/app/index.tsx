import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { AppButton } from '../src/components/AppButton';
import { useAuthStore } from '../src/state/useAuthStore';
import { colors } from '../src/theme/colors';
import { fonts, text as t } from '../src/theme/typography';
import { spacing, radius, shadow } from '../src/theme/spacing';

export default function LandingScreen() {
  const { user } = useAuthStore();

  // App launch logic: if a profile already exists, route straight to its dashboard.
  useEffect(() => {
    if (user) {
      router.replace(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    }
  }, [user]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Welcome to ClassBridge</Text>
        <Text style={styles.subtitle}>The offline-first digital learning environment.</Text>
      </View>

      <View style={styles.actions}>
        <AppButton 
          title="Log In" 
          icon="person" 
          onPress={() => router.push('/login')} 
          accent={colors.blue}
          style={styles.button}
        />
        <AppButton 
          title="Create Account" 
          icon="add" 
          onPress={() => router.push('/register')} 
          accent={colors.navy}
          style={styles.button}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          Your data stays safely on your device and your local school hub.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingHorizontal: spacing.screen },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  logo: { width: 70, height: 70 },
  title: { ...t.headlineLgMobile, textAlign: 'center' },
  subtitle: {
    ...t.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actions: { gap: spacing.md, marginTop: spacing.md },
  button: { ...shadow.button },
  footer: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.md },
  footerNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.lg,
  },
});
