import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { HubUrlInput } from '../../src/components/HubUrlInput';
import { useAuthStore } from '../../src/state/useAuthStore';
import { useSyncStore } from '../../src/state/useSyncStore';
import { api } from '../../src/services/apiClient';
import { upsertClassroom } from '../../src/db/repositories/classroomRepo';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function JoinClass() {
  // hubUrl/code may arrive pre-filled from the QR scanner (scan-join screen).
  const params = useLocalSearchParams<{ hubUrl?: string; code?: string }>();
  const { user, updateHubUrl, updateName, refresh } = useAuthStore();
  const { pull } = useSyncStore();
  const [name, setName] = useState(user?.name ?? '');
  const [hubUrl, setHubUrl] = useState(params.hubUrl ?? user?.hubUrl ?? '');
  const [code, setCode] = useState(params.code ?? '');
  const [joining, setJoining] = useState(false);

  const join = async () => {
    if (!name.trim()) return Alert.alert('Enter your name', 'We need your name to join.');
    if (!hubUrl.trim()) return Alert.alert('Enter hub URL', 'Ask your teacher for the hub URL.');
    if (!code.trim()) return Alert.alert('Enter class code', 'Ask your teacher for the class code.');

    setJoining(true);
    try {
      // Persist name + hub url first so the profile is complete.
      if (name.trim() !== user?.name) await updateName(name.trim());
      await updateHubUrl(hubUrl.trim());
      await refresh();
      const current = useAuthStore.getState().user;
      if (!current) throw new Error('Profile not ready');

      const result = await api.joinClass(hubUrl.trim(), code.trim().toUpperCase(), {
        id: current.id,
        name: name.trim(),
        deviceId: current.deviceId,
      });

      await upsertClassroom({
        id: result.classroom.id,
        name: result.classroom.name,
        classCode: result.classroom.class_code,
        lastSyncedAt: null,
      });

      // Initial pull to download lessons for offline use.
      await pull(current, result.classroom.id);

      Alert.alert('Joined ✅', `You joined "${result.classroom.name}". Lessons downloaded for offline use.`);
      router.replace('/student/lessons');
    } catch (err) {
      Alert.alert('Could not join', (err as Error).message);
    }
    setJoining(false);
  };

  return (
    <Screen header={<AppBar title="Join a Class" role="student" back />}>
      <AppCard>
        <Text style={styles.title}>Join your class</Text>
        <Text style={styles.hint}>Scan your teacher's QR code, or enter the code manually. Stay on the same Wi-Fi/hotspot as the hub.</Text>

        <AppButton
          title="Scan QR Code"
          icon="scan"
          variant="secondary"
          onPress={() => router.push('/student/scan-join')}
          style={styles.scanBtn}
        />

        <TextField label="Your name" value={name} onChangeText={setName} placeholder="e.g. Ada" autoCapitalize="words" />
        <HubUrlInput value={hubUrl} onChangeText={setHubUrl} />
        <TextField
          label="Class code"
          value={code}
          onChangeText={setCode}
          placeholder="e.g. JSS2-4821"
          autoCapitalize="characters"
        />
        <AppButton title="Join Class" icon="school" onPress={join} loading={joining} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 18 },
  scanBtn: { marginBottom: spacing.lg },
});
