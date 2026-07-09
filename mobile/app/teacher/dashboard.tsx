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
import { api } from '../../src/services/apiClient';
import { colors } from '../../src/theme/colors';
import { fonts, text as t } from '../../src/theme/typography';
import { spacing, radius, shadow } from '../../src/theme/spacing';

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const { online, check } = useHubStore();
  const [classCount, setClassCount] = useState(0);
  const [pending, setPending] = useState(0);
  const [recentStudents, setRecentStudents] = useState<string[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const ok = await check(user.hubUrl);
    if (ok && user.hubUrl) {
      try {
        const { classrooms } = await api.listClassrooms(user.hubUrl, user.id);
        setClassCount(classrooms.length);

        let pendingTotal = 0;
        const students = new Set<string>();
        let firstInsight: string | null = null;

        for (const c of classrooms) {
          const { submissions } = await api.listSubmissions(user.hubUrl, c.id);
          const subs = submissions as Array<{ studentName: string; score: number | null }>;
          pendingTotal += subs.filter((s) => s.score == null).length;
          subs.slice(0, 5).forEach((s) => students.add(s.studentName));
          if (firstInsight == null && subs.length > 0) {
            const ins = await api.classroomInsight(user.hubUrl, c.id);
            firstInsight = ins.summary;
          }
        }
        setPending(pendingTotal);
        setRecentStudents([...students].slice(0, 4));
        setInsight(firstInsight);
      } catch {
        // leave prior values; badge shows offline
      }
    }
    setRefreshing(false);
  }, [user, check]);

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
          role="teacher"
          brand
          right={<AppBarAction name="refresh" onPress={load} />}
        />
      }
      onRefresh={load}
      refreshing={refreshing}
    >
      <View style={styles.headRow}>
        <View style={styles.flex}>
          <Text style={styles.name}>Hi {user?.name?.trim() || 'Teacher'}</Text>
        </View>
        <HubStatusBadge online={online} />
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Classrooms" value={classCount} icon="classroom" accent={colors.navy} accentSoft={colors.navySoft} />
        <StatCard
          label="Pending"
          value={pending}
          icon="pending"
          accent={colors.warning}
          accentSoft={colors.warningSoft}
        />
      </View>

      <AppCard accent={colors.blue} style={styles.insightCard}>
        <View style={styles.insightHead}>
          <View style={[styles.insightIcon, { backgroundColor: colors.blueSoft }]}>
            <Icon name="insight" size={20} color={colors.blue} />
          </View>
          <Text style={styles.cardTitle}>AI Class Insight</Text>
        </View>
        <Text style={styles.insightText}>
          {insight ?? 'No insights yet. Once students submit work, Gemma will summarise how the class is doing.'}
        </Text>
        <AppButton
          title="View Insights"
          icon="insight"
          onPress={() => router.push('/teacher/insights')}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>

      {recentStudents.length > 0 ? (
        <AppCard>
          <Text style={styles.cardTitle}>Recently synced students</Text>
          <Text style={styles.students}>{recentStudents.join(', ')}</Text>
        </AppCard>
      ) : null}

      <SectionHeader title="Quick actions" />
      <View style={styles.grid}>
        <QuickButton icon="classroom" label="Classrooms" onPress={() => router.push('/teacher/classrooms')} />
        <QuickButton icon="add" label="Create Assignment" onPress={() => router.push('/teacher/assignment-create')} />
        <QuickButton icon="library" label="Library" onPress={() => router.push('/teacher/library')} />
        <QuickButton icon="submissions" label="Submissions" onPress={() => router.push('/teacher/submissions')} />
      </View>
    </Screen>
  );
}

function QuickButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
      <View style={styles.quickIcon}>
        <Icon name={icon} size={22} color={colors.navy} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.md },
  flex: { flex: 1 },
  name: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.navy, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  insightCard: { marginTop: spacing.xs },
  insightHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  insightIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  insightText: { ...t.bodySm, color: colors.textMuted },
  students: { ...t.bodySm, color: colors.text, marginTop: spacing.xs },
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
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text, textAlign: 'center' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
