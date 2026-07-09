import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar, AppBarAction } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { StatCard } from '../../src/components/StatCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { HubStatusBadge } from '../../src/components/SyncStatusBadge';
import { Icon, IconName } from '../../src/components/Icon';
import { useAuthStore } from '../../src/state/useAuthStore';
import { useHubStore } from '../../src/state/useHubStore';
import { useSyncStore } from '../../src/state/useSyncStore';
import { listClassrooms } from '../../src/db/repositories/classroomRepo';
import { listAssignments } from '../../src/db/repositories/assignmentRepo';
import { countDownloaded } from '../../src/db/repositories/resourceRepo';
import { getNetworkState } from '../../src/services/networkService';
import { colors } from '../../src/theme/colors';
import { fonts, text as t } from '../../src/theme/typography';
import { spacing, radius, shadow } from '../../src/theme/spacing';

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
    <Screen
      header={
        <AppBar
          title="ClassBridge AI"
          role="student"
          brand
          right={<AppBarAction name="sync" onPress={() => router.push('/student/sync')} />}
        />
      }
      onRefresh={load}
      refreshing={refreshing}
    >
      <View style={styles.headRow}>
        <View style={styles.flex}>
          <Text style={styles.name}>Hi {user?.name?.trim() || 'Student'} 👋</Text>
        </View>
        <HubStatusBadge online={online} />
      </View>
      <Text style={styles.net}>Network: {netType}. Lessons you downloaded work fully offline.</Text>

      <View style={styles.statsRow}>
        <StatCard label="Classes" value={classes} icon="classroom" accent={colors.blue} accentSoft={colors.blueSoft} />
        <StatCard label="Lessons" value={lessons} icon="lessons" accent={colors.navy} accentSoft={colors.navySoft} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Downloaded" value={downloaded} icon="check" accent={colors.success} accentSoft={colors.successSoft} />
        <StatCard label="Pending Sync" value={pendingCount} icon="pending" accent={colors.warning} accentSoft={colors.warningSoft} />
      </View>

      {pendingCount > 0 ? (
        <AppCard accent={colors.warning}>
          <View style={styles.pendingHead}>
            <Icon name="cloudOff" size={18} color={colors.warning} />
            <Text style={styles.pendingTitle}>{pendingCount} submission(s) saved offline</Text>
          </View>
          <Text style={styles.pendingBody}>Reconnect to the hub and sync to send your work to the teacher.</Text>
          <AppButton title="Open Sync Center" icon="sync" onPress={() => router.push('/student/sync')} style={{ marginTop: spacing.md }} />
        </AppCard>
      ) : null}

      <SectionHeader title="Quick actions" />
      <View style={styles.grid}>
        <QuickButton icon="add" label="Join Class" onPress={() => router.push('/student/join-class')} />
        <QuickButton icon="lessons" label="My Lessons" onPress={() => router.push('/student/lessons')} />
        <QuickButton icon="sync" label="Sync Center" onPress={() => router.push('/student/sync')} />
        <QuickButton icon="feedback" label="Feedback" onPress={() => router.push('/student/feedback')} />
      </View>
    </Screen>
  );
}

function QuickButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
      <View style={styles.quickIcon}>
        <Icon name={icon} size={22} color={colors.blue} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  name: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.navy, marginTop: 2 },
  net: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginTop: spacing.sm, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  pendingHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  pendingTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  pendingBody: { ...t.bodySm, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quick: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text, textAlign: 'center' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
