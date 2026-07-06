import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { StatCard } from '../../src/components/StatCard';
import { HubStatusBadge } from '../../src/components/SyncStatusBadge';
import { useAuthStore } from '../../src/state/useAuthStore';
import { useHubStore } from '../../src/state/useHubStore';
import { useSyncStore } from '../../src/state/useSyncStore';
import { listClassrooms } from '../../src/db/repositories/classroomRepo';
import { listAssignments } from '../../src/db/repositories/assignmentRepo';
import { countDownloaded } from '../../src/db/repositories/resourceRepo';
import { getNetworkState } from '../../src/services/networkService';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const { online, check } = useHubStore();
  const { pendingCount, refreshStatus } = useSyncStore();
  const [classes, setClasses] = useState(0);
  const [lessons, setLessons] = useState(0);
  const [downloaded, setDownloaded] = useState(0);
  const [netType, setNetType] = useState('unknown');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const [cls, asgs, dl, net] = await Promise.all([
      listClassrooms(),
      listAssignments(),
      countDownloaded(),
      getNetworkState(),
    ]);
    setClasses(cls.length);
    setLessons(asgs.length);
    setDownloaded(dl);
    setNetType(net.type);
    await refreshStatus();
    if (user?.hubUrl) check(user.hubUrl);
    setRefreshing(false);
  }, [user, check, refreshStatus]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.greeting}>Student Mode</Text>
          <Text style={styles.name}>Hi {user?.name ?? 'Student'} 👋</Text>
        </View>
        <AppButton title="⚙︎" variant="ghost" onPress={() => router.push('/student/settings')} style={styles.gear} />
      </View>

      <HubStatusBadge online={online} />
      <Text style={styles.net}>Network: {netType}. Lessons you downloaded work fully offline.</Text>

      <View style={styles.statsRow}>
        <StatCard label="Classes" value={classes} icon="🏫" accent={colors.blue} />
        <View style={{ width: spacing.md }} />
        <StatCard label="Lessons" value={lessons} icon="📖" accent={colors.navy} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Downloaded" value={downloaded} icon="✅" accent={colors.success} />
        <View style={{ width: spacing.md }} />
        <StatCard label="Pending Sync" value={pendingCount} icon="⏳" accent={colors.warning} />
      </View>

      {pendingCount > 0 ? (
        <AppCard accent={colors.warning}>
          <Text style={styles.pendingTitle}>⏳ {pendingCount} submission(s) saved offline</Text>
          <Text style={styles.pendingBody}>Reconnect to the hub and sync to send your work to the teacher.</Text>
          <AppButton title="Open Sync Center" icon="🔄" onPress={() => router.push('/student/sync')} style={{ marginTop: spacing.md }} />
        </AppCard>
      ) : null}

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.grid}>
        <QuickButton icon="➕" label="Join Class" onPress={() => router.push('/student/join-class')} />
        <QuickButton icon="📖" label="My Lessons" onPress={() => router.push('/student/lessons')} />
        <QuickButton icon="🔄" label="Sync Center" onPress={() => router.push('/student/sync')} />
        <QuickButton icon="🏅" label="Feedback" onPress={() => router.push('/student/feedback')} />
        <QuickButton icon="⚙️" label="Settings" onPress={() => router.push('/student/settings')} />
      </View>
    </Screen>
  );
}

function QuickButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <AppCard onPress={onPress} style={styles.quick}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  flex: { flex: 1 },
  greeting: { fontSize: 13, fontWeight: '700', color: colors.blue, textTransform: 'uppercase' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  gear: { minHeight: 44, paddingHorizontal: spacing.md, minWidth: 52 },
  net: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', marginTop: spacing.md },
  pendingTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  pendingBody: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quick: { width: '48%', alignItems: 'center', paddingVertical: spacing.lg },
  quickIcon: { fontSize: 28, marginBottom: spacing.xs },
  quickLabel: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
