import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { StatCard } from '../../src/components/StatCard';
import { HubStatusBadge } from '../../src/components/SyncStatusBadge';
import { useAuthStore } from '../../src/state/useAuthStore';
import { useHubStore } from '../../src/state/useHubStore';
import { useSyncStore } from '../../src/state/useSyncStore';
import { getNetworkState } from '../../src/services/networkService';
import { timeAgo } from '../../src/utils/dates';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function SyncCenter() {
  const user = useAuthStore((s) => s.user);
  const { online, detail, check, checking } = useHubStore();
  const { pendingCount, lastSyncAt, syncing, refreshStatus, fullSync } = useSyncStore();
  const [netType, setNetType] = useState('unknown');

  const load = useCallback(async () => {
    const net = await getNetworkState();
    setNetType(net.type);
    await refreshStatus();
    if (user?.hubUrl) await check(user.hubUrl);
  }, [user, check, refreshStatus]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const doSync = async () => {
    if (!user) return;
    const ok = await check(user.hubUrl);
    if (!ok) {
      Alert.alert('Hub not reachable', 'Connect to the same Wi-Fi/hotspot as the hub, then try again.');
      return;
    }
    try {
      const result = await fullSync(user);
      Alert.alert(
        'Sync complete ✅',
        `Sent ${result.pushed} submission(s), downloaded ${result.pulledAssignments} lesson(s).`
      );
    } catch (err) {
      Alert.alert('Sync failed', `${(err as Error).message}\n\nYour work is safe and marked for retry.`);
    }
    await load();
  };

  return (
    <Screen onRefresh={load} refreshing={checking}>
      <HubStatusBadge online={online} />
      <Text style={styles.detail}>{detail}</Text>

      <View style={styles.statsRow}>
        <StatCard label="Pending Sync" value={pendingCount} icon="⏳" accent={colors.warning} />
        <View style={{ width: spacing.md }} />
        <StatCard label="Network" value={netType} icon="📶" accent={colors.blue} />
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Sync your work</Text>
        <Text style={styles.body}>
          Syncing sends your completed quizzes to the teacher and downloads any new lessons. You only need this when
          you are back near the hub.
        </Text>
        <Text style={styles.lastSync}>Last sync: {timeAgo(lastSyncAt)}</Text>
        <AppButton
          title={pendingCount > 0 ? `Sync Now (${pendingCount} pending)` : 'Sync Now'}
          icon="🔄"
          onPress={doSync}
          loading={syncing}
          style={{ marginTop: spacing.md }}
        />
        <AppButton
          title="Check Hub Connection"
          icon="📡"
          variant="secondary"
          onPress={() => check(user?.hubUrl ?? null)}
          loading={checking}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>

      <AppCard accent={colors.info}>
        <Text style={styles.cardTitle}>How offline sync works</Text>
        <Text style={styles.step}>1. Download lessons while connected.</Text>
        <Text style={styles.step}>2. Read and answer quizzes offline — saved on your device.</Text>
        <Text style={styles.step}>3. Reconnect and tap Sync to send answers and get feedback.</Text>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  detail: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', marginBottom: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  lastSync: { fontSize: 13, color: colors.text, marginTop: spacing.md, fontWeight: '600' },
  step: { fontSize: 14, color: colors.text, lineHeight: 22 },
});
