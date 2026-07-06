import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SubmissionCard } from '../../src/components/SubmissionCard';
import { AppCard } from '../../src/components/AppCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

interface ClassRow {
  id: string;
  name: string;
}
interface Sub {
  id: string;
  assignmentTitle: string;
  studentName: string;
  score: number | null;
  maxScore: number | null;
  feedback: Array<{ feedback: string; misconception: string }>;
}

export default function Submissions() {
  const params = useLocalSearchParams<{ classroomId?: string }>();
  const user = useAuthStore((s) => s.user);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classroomId, setClassroomId] = useState<string | undefined>(params.classroomId);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.hubUrl) return;
    setRefreshing(true);
    try {
      const { classrooms } = await api.listClassrooms(user.hubUrl, user.id);
      setClasses(classrooms);
      const cid = classroomId ?? classrooms[0]?.id;
      setClassroomId(cid);
      if (cid) {
        const { submissions } = await api.listSubmissions(user.hubUrl, cid);
        setSubs(submissions as Sub[]);
      }
    } catch (err) {
      Alert.alert('Cannot reach hub', (err as Error).message);
    }
    setRefreshing(false);
  }, [user, classroomId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      {classes.length > 1 ? (
        <View style={styles.chips}>
          {classes.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setClassroomId(c.id)}
              style={[styles.chip, classroomId === c.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, classroomId === c.id && styles.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {subs.length === 0 ? (
        <EmptyState icon="📥" title="No submissions yet" message="When students sync their quizzes, they appear here with AI feedback." />
      ) : (
        subs.map((s) => (
          <View key={s.id}>
            <SubmissionCard
              title={s.assignmentTitle}
              studentName={s.studentName}
              score={s.score}
              maxScore={s.maxScore}
              status="synced"
              onPress={() => setExpanded(expanded === s.id ? null : s.id)}
            />
            {expanded === s.id ? (
              <AppCard style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>AI Feedback</Text>
                {s.feedback.map((f, i) => (
                  <View key={i} style={styles.feedbackItem}>
                    <Text style={styles.feedbackText}>• {f.feedback}</Text>
                    {f.misconception ? (
                      <Text style={styles.misconception}>Misconception: {f.misconception}</Text>
                    ) : null}
                  </View>
                ))}
              </AppCard>
            ) : null}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.navy, fontWeight: '800' },
  feedbackCard: { marginTop: -spacing.sm, backgroundColor: colors.infoSoft },
  feedbackTitle: { fontSize: 14, fontWeight: '800', color: colors.navy, marginBottom: spacing.sm },
  feedbackItem: { marginBottom: spacing.sm },
  feedbackText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  misconception: { fontSize: 13, color: colors.warning, marginTop: 2, fontStyle: 'italic' },
});
