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
import { api } from '../../src/services/apiClient';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

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
    <Screen onRefresh={load} refreshing={refreshing}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.greeting}>Teacher Mode</Text>
          <Text style={styles.name}>Hi {user?.name ?? 'Teacher'} 👋</Text>
        </View>
        <AppButton title="⚙︎" variant="ghost" onPress={() => router.push('/teacher/settings')} style={styles.gear} />
      </View>

      <HubStatusBadge online={online} />

      <View style={styles.statsRow}>
        <StatCard label="Classrooms" value={classCount} icon="🏫" accent={colors.navy} />
        <View style={{ width: spacing.md }} />
        <StatCard label="Pending" value={pending} icon="⏳" accent={colors.warning} />
      </View>

      <AppCard accent={colors.blue}>
        <Text style={styles.cardTitle}>🧠 AI Class Insight</Text>
        <Text style={styles.insightText}>
          {insight ?? 'No insights yet. Once students submit work, Gemma will summarise how the class is doing.'}
        </Text>
        <AppButton
          title="View Insights"
          variant="primary"
          onPress={() => router.push('/teacher/insights')}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>

      {recentStudents.length > 0 ? (
        <AppCard>
          <Text style={styles.cardTitle}>🔄 Recently Synced Students</Text>
          <Text style={styles.students}>{recentStudents.join(', ')}</Text>
        </AppCard>
      ) : null}

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.grid}>
        <QuickButton icon="🏫" label="Classrooms" onPress={() => router.push('/teacher/classrooms')} />
        <QuickButton icon="📚" label="Library" onPress={() => router.push('/teacher/library')} />
        <QuickButton icon="📝" label="Create Assignment" onPress={() => router.push('/teacher/assignment-create')} />
        <QuickButton icon="📥" label="Submissions" onPress={() => router.push('/teacher/submissions')} />
        <QuickButton icon="🧠" label="AI Insights" onPress={() => router.push('/teacher/insights')} />
        <QuickButton icon="⚙️" label="Settings" onPress={() => router.push('/teacher/settings')} />
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
  statsRow: { flexDirection: 'row', marginTop: spacing.md, marginBottom: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  insightText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  students: { fontSize: 14, color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quick: { width: '48%', alignItems: 'center', paddingVertical: spacing.lg },
  quickIcon: { fontSize: 28, marginBottom: spacing.xs },
  quickLabel: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
