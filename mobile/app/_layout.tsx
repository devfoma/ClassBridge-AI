import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { getMobileDb } from '../src/db/mobileDb';
import { useAuthStore } from '../src/state/useAuthStore';
import { applyInterFont } from '../src/theme/fontPatch';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';

// Patch RN Text/TextInput so all text renders in Inter (respecting weight).
applyInterFont();

export default function RootLayout() {
  const [dataReady, setDataReady] = useState(false);
  const init = useAuthStore((s) => s.init);

  const [fontsReady] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    (async () => {
      // 1. Initialise SQLite, 2. load local user.
      await getMobileDb();
      await init();
      setDataReady(true);
    })();
  }, [init]);

  if (!dataReady || !fontsReady) {
    return (
      <View style={styles.loading}>
        <Image source={require('../assets/splash.png')} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="large" color={colors.blue} style={styles.spinner} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="teacher" />
        <Stack.Screen name="student" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  logo: { width: 200, height: 200 },
  spinner: { marginTop: spacing.lg },
});
