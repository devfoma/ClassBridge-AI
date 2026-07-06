import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from './Screen';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
import { TextField } from './TextField';
import { HubUrlInput } from './HubUrlInput';
import { HubStatusBadge } from './SyncStatusBadge';
import { useAuthStore } from '../state/useAuthStore';
import { useHubStore } from '../state/useHubStore';
import { api } from '../services/apiClient';
import { clearLocalData, resetEverything } from '../db/mobileDb';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function SettingsView() {
  const { user, updateHubUrl, updateName, reset } = useAuthStore();
  const { online, detail, check, checking } = useHubStore();
  const [hubUrl, setHubUrl] = useState(user?.hubUrl ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [gemma, setGemma] = useState<string | null>(null);

  useEffect(() => {
    setHubUrl(user?.hubUrl ?? '');
    setName(user?.name ?? '');
  }, [user]);

  const save = async () => {
    await updateHubUrl(hubUrl);
    if (name.trim()) await updateName(name);
    Alert.alert('Saved', 'Settings updated.');
  };

  const testHub = async () => {
    await updateHubUrl(hubUrl);
    const ok = await check(hubUrl);
    if (ok && hubUrl) {
      try {
        const status = await api.gemmaStatus(hubUrl);
        setGemma(
          `${status.gemma.provider} (${status.gemma.model}) — ${status.gemma.reachable ? 'ready' : 'unreachable'}`
        );
      } catch {
        setGemma('unknown');
      }
    }
  };

  const clearData = () => {
    Alert.alert('Clear local data?', 'Removes downloaded lessons and submissions on this device. Your profile stays.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearLocalData();
          Alert.alert('Cleared', 'Local demo data removed.');
        },
      },
    ]);
  };

  const switchRole = () => {
    Alert.alert('Switch role / reset profile?', 'This clears everything on this device and returns to role selection.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetEverything();
          reset();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <Screen>
      <HubStatusBadge online={online} />
      <Text style={styles.detail}>{detail}</Text>

      <AppCard>
        <Text style={styles.cardTitle}>Connection</Text>
        <HubUrlInput value={hubUrl} onChangeText={setHubUrl} />
        <AppButton title="Save Settings" icon="💾" onPress={save} />
        <AppButton
          title="Test Hub Connection"
          icon="📡"
          variant="secondary"
          onPress={testHub}
          loading={checking}
          style={{ marginTop: spacing.md }}
        />
        {gemma ? <Text style={styles.gemma}>Gemma provider: {gemma}</Text> : null}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Profile</Text>
        <TextField label="Your name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Role</Text>
          <Text style={styles.metaValue}>{user?.role ?? '—'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Device ID</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {user?.deviceId ?? '—'}
          </Text>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Danger zone</Text>
        <AppButton title="Clear Local Data" icon="🧹" variant="ghost" onPress={clearData} />
        <AppButton
          title="Switch Role / Reset"
          icon="🔄"
          variant="danger"
          onPress={switchRole}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  detail: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  gemma: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  metaLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  metaValue: { fontSize: 14, color: colors.text, flex: 1, textAlign: 'right', marginLeft: spacing.md },
});
