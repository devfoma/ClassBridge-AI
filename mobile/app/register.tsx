import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { AppBar } from '../src/components/AppBar';
import { TextField } from '../src/components/TextField';
import { AppButton } from '../src/components/AppButton';
import { useAuthStore } from '../src/state/useAuthStore';
import { UserRole } from '../src/types/user';
import { colors } from '../src/theme/colors';
import { spacing, radius, shadow } from '../src/theme/spacing';
import { fonts, text as t } from '../src/theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [hubUrl, setHubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const user = await register(email, password, role, name, hubUrl);
      router.replace(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen header={<AppBar title="Create Account" back onBack={() => router.back()} />}>
      <View style={styles.content}>
        <Text style={styles.title}>Join ClassBridge</Text>
        <Text style={styles.subtitle}>Set up your profile to get started.</Text>

        <TextField
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Mrs. Okoye or Ada"
          autoCapitalize="words"
        />

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="your.email@school.edu"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a strong password"
          secureTextEntry
        />

        <Text style={styles.label}>I am a...</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleBox, role === 'student' && styles.roleActive]} 
            onPress={() => setRole('student')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="person" size={24} color={role === 'student' ? '#ffffff' : colors.textMuted} />
            <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleBox, role === 'teacher' && styles.roleActiveTeacher]} 
            onPress={() => setRole('teacher')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="school" size={24} color={role === 'teacher' ? '#ffffff' : colors.textMuted} />
            <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Teacher</Text>
          </TouchableOpacity>
        </View>

        <TextField
          label="Hub URL (Optional)"
          value={hubUrl}
          onChangeText={setHubUrl}
          placeholder="http://192.168.1.100:3000"
          keyboardType="url"
          autoCapitalize="none"
        />
        <Text style={styles.helperText}>
          If provided, your account will be backed up to the Hub immediately.
        </Text>

        <AppButton 
          title="Create Account" 
          onPress={handleRegister} 
          loading={loading} 
          style={styles.btn} 
          accent={colors.navy} 
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  title: { ...t.headlineSm, color: colors.navy },
  subtitle: { ...t.bodyMd, color: colors.textMuted, marginBottom: spacing.lg, marginTop: spacing.xs },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
  roleContainer: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  roleBox: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: spacing.md, 
    borderRadius: radius.md, 
    backgroundColor: colors.surface2,
    ...shadow.card,
  },
  roleActive: { backgroundColor: colors.blue },
  roleActiveTeacher: { backgroundColor: colors.navy },
  roleText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  roleTextActive: { color: '#ffffff' },
  helperText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginTop: -spacing.sm, marginBottom: spacing.md, paddingHorizontal: spacing.sm },
  btn: { marginTop: spacing.sm },
});
