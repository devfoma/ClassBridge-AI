import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from './Screen';
import { AppBar } from './AppBar';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
import { TextField } from './TextField';
import { HubUrlInput } from './HubUrlInput';
import { HubStatusBadge } from './SyncStatusBadge';
import { Icon } from './Icon';
import { useAuthStore } from '../state/useAuthStore';
import { useHubStore } from '../state/useHubStore';
import { api } from '../services/apiClient';
import { clearLocalData, resetEverything } from '../db/mobileDb';
import { colors, roleAccent } from '../theme/colors';
import { fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export function SettingsView() {
  const { user, updateHubUrl, updateName, reset } = useAuthStore();
  const { online, detail, check, checking } = useHubStore();
  const [hubUrl, setHubUrl] = useState(user?.hubUrl ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [gemma, setGemma] = useState<string | null>(null);
  const { accent, accentSoft } = roleAccent(user?.role);

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
    <Screen header={<AppBar title="Settings" role={user?.role} />}>
      <View style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: accentSoft }]}>
          <Icon name={user?.role === 'teacher' ? 'school' : 'person'} size={28} color={accent} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.name}>{user?.name?.trim() || 'ClassBridge user'}</Text>
          <Text style={styles.role}>{user?.role === 'teacher' ? 'Teacher' : 'Student'}</Text>
        </View>
        <HubStatusBadge online={online} />
      </View>
      <Text style={styles.detail}>{detail}</Text>

      <AppCard>
        <Text style={styles.cardTitle}>Connection</Text>
        <HubUrlInput value={hubUrl} onChangeText={setHubUrl} />
        <AppButton title="Save Settings" icon="save" onPress={save} accent={accent} />
        <AppButton
          title="Test Hub Connection"
          icon="test"
          variant="secondary"
          onPress={testHub}
          loading={checking}
          accent={accent}
          style={{ marginTop: spacing.md }}
        />
        {gemma ? (
          <View style={styles.gemmaRow}>
            <Icon name="ai" size={16} color={colors.textMuted} />
            <Text style={styles.gemma}>Gemma: {gemma}</Text>
          </View>
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Profile</Text>
        <TextField
          label="Your name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          accent={accent}
        />
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
        <AppButton title="Clear Local Data" icon="clear" variant="ghost" onPress={clearData} />
        <AppButton
          title="Switch Role / Reset"
          icon="reset"
          variant="danger"
          onPress={switchRole}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  flex: { flex: 1 },
  avatar: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  role: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, marginTop: 1 },
  detail: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginBottom: spacing.md },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: spacing.md },
  gemmaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  gemma: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  metaLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  metaValue: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, flex: 1, textAlign: 'right', marginLeft: spacing.md },
});
