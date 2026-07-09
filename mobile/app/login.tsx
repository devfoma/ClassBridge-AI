import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { AppBar } from '../src/components/AppBar';
import { TextField } from '../src/components/TextField';
import { AppButton } from '../src/components/AppButton';
import { useAuthStore } from '../src/state/useAuthStore';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { fonts, text as t } from '../src/theme/typography';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hubUrl, setHubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password, hubUrl);
      router.replace(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen header={<AppBar title="Log In" back onBack={() => router.back()} />}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Enter your details to log in to your account.</Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="your.email@school.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          accent={colors.blue}
        />
        
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          accent={colors.blue}
        />

        <TextField
          label="Hub URL (Optional)"
          value={hubUrl}
          onChangeText={setHubUrl}
          placeholder="http://192.168.1.100:3000"
          keyboardType="url"
          autoCapitalize="none"
          accent={colors.navy}
        />
        <Text style={styles.helperText}>
          Provide the Hub URL if you're logging into this device for the first time so we can fetch your profile.
        </Text>

        <AppButton 
          title="Log In" 
          onPress={handleLogin} 
          loading={loading} 
          style={styles.btn} 
          accent={colors.blue} 
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  title: { ...t.headlineSm, color: colors.navy },
  subtitle: { ...t.bodyMd, color: colors.textMuted, marginBottom: spacing.lg, marginTop: spacing.xs },
  helperText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginTop: -spacing.sm, marginBottom: spacing.md, paddingHorizontal: spacing.sm },
  btn: { marginTop: spacing.md },
});
