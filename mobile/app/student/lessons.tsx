import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { AssignmentCard } from '../../src/components/AssignmentCard';
import { EmptyState } from '../../src/components/EmptyState';
import { SyncStatusBadge } from '../../src/components/SyncStatusBadge';
import { useAuthStore } from '../../src/state/useAuthStore';
import { useSyncStore } from '../../src/state/useSyncStore';
import { listAssignments } from '../../src/db/repositories/assignmentRepo';
import { listSubmissions } from '../../src/db/repositories/submissionRepo';
import { LocalAssignment } from '../../src/types/assignment';
import { SubmissionStatus } from '../../src/types/submission';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function Lessons() {
  const user = useAuthStore((s) => s.user);
  const { pull, syncing } = useSyncStore();
  const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
  const [statusByAssignment, setStatusByAssignment] = useState<Record<string, SubmissionStatus>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const [asgs, subs] = await Promise.all([listAssignments(), listSubmissions()]);
    setAssignments(asgs);
    const map: Record<string, SubmissionStatus> = {};
    for (const s of subs) {
      // keep the latest (subs are ordered desc by created_at)
      if (!map[s.assignmentId]) map[s.assignmentId] = s.status;
    }
    setStatusByAssignment(map);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refreshFromHub = async () => {
    if (!user) return;
    try {
      await pull(user);
      await load();
    } catch {
      // stay offline; local lessons still available
    }
  };

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <AppButton title="Download New Lessons" icon="⬇️" variant="secondary" onPress={refreshFromHub} loading={syncing} />

      <Text style={styles.section}>Your lessons</Text>
      {assignments.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No lessons yet"
          message="Join a class and pull assignments. Once downloaded, lessons open offline."
        />
      ) : (
        assignments.map((a) => (
          <AssignmentCard
            key={a.id}
            title={a.title}
            instructions={a.instructions}
            questionCount={a.quiz.questions.length}
            downloaded
            onPress={() => router.push({ pathname: '/student/lesson-detail', params: { id: a.id } })}
            footer={
              statusByAssignment[a.id] ? (
                <View style={styles.footerRow}>
                  <SyncStatusBadge status={statusByAssignment[a.id]} />
                </View>
              ) : (
                <Text style={styles.notStarted}>Not started</Text>
              )
            }
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  footerRow: { flexDirection: 'row' },
  notStarted: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
