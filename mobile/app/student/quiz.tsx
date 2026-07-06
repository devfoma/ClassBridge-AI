import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { AppCard } from '../../src/components/AppCard';
import { EmptyState } from '../../src/components/EmptyState';
import { QuizQuestion } from '../../src/components/QuizQuestion';
import { useAuthStore } from '../../src/state/useAuthStore';
import { useSyncStore } from '../../src/state/useSyncStore';
import { getAssignment } from '../../src/db/repositories/assignmentRepo';
import { getByAssignment, upsertSubmission } from '../../src/db/repositories/submissionRepo';
import { LocalAssignment } from '../../src/types/assignment';
import { QuizAnswer } from '../../src/types/quiz';
import { LocalSubmission } from '../../src/types/submission';
import { scoreQuizLocally, answeredCount } from '../../src/services/quizScoring';
import { newId } from '../../src/utils/ids';
import { nowIso } from '../../src/utils/dates';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function Quiz() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { refreshStatus } = useSyncStore();
  const [assignment, setAssignment] = useState<LocalAssignment | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    const a = await getAssignment(params.id);
    setAssignment(a);
    const existing = await getByAssignment(params.id);
    if (existing) {
      setSubmissionId(existing.id);
      const map: Record<string, string> = {};
      existing.answers.forEach((ans) => (map[ans.questionId] = ans.answer));
      setAnswers(map);
    } else {
      setSubmissionId(newId('sub'));
    }
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const buildAnswers = (): QuizAnswer[] =>
    (assignment?.quiz.questions ?? []).map((q) => ({ questionId: q.id, answer: answers[q.id] ?? '' }));

  const persist = async (status: 'draft' | 'completed_unsynced') => {
    if (!assignment || !user || !submissionId) return;
    const ans = buildAnswers();
    const local = scoreQuizLocally(assignment.quiz, ans);
    const submission: LocalSubmission = {
      id: submissionId,
      assignmentId: assignment.id,
      studentId: user.id,
      answers: ans,
      status,
      // Provisional local score (MC only). The hub re-grades authoritatively on sync.
      score: status === 'completed_unsynced' ? local.score : null,
      maxScore: status === 'completed_unsynced' ? local.maxScore : null,
      feedback: null,
      createdAt: nowIso(),
      syncedAt: null,
    };
    await upsertSubmission(submission);
    await refreshStatus();
  };

  const saveDraft = async () => {
    setSaving(true);
    await persist('draft');
    setSaving(false);
    Alert.alert('Saved offline', 'Your progress is saved on this device.');
  };

  const submit = async () => {
    if (!assignment) return;
    const answered = answeredCount(buildAnswers());
    if (answered < assignment.quiz.questions.length) {
      Alert.alert(
        'Some questions are blank',
        `You answered ${answered} of ${assignment.quiz.questions.length}. Submit anyway?`,
        [
          { text: 'Keep answering', style: 'cancel' },
          { text: 'Submit', onPress: doSubmit },
        ]
      );
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    setSaving(true);
    await persist('completed_unsynced');
    setSaving(false);
    Alert.alert(
      'Saved Offline ✅',
      'Your quiz is completed and saved on this device. Open Sync Center when you are back near the hub.',
      [{ text: 'Go to Sync Center', onPress: () => router.replace('/student/sync') }]
    );
  };

  if (!assignment) {
    return (
      <Screen>
        <EmptyState icon="📝" title="Quiz not found" message="Pull lessons again from the hub." />
      </Screen>
    );
  }

  const answered = answeredCount(buildAnswers());

  return (
    <Screen>
      <AppCard accent={colors.blue}>
        <Text style={styles.title}>{assignment.title}</Text>
        <Text style={styles.progress}>
          {answered} / {assignment.quiz.questions.length} answered · works fully offline
        </Text>
      </AppCard>

      {assignment.quiz.questions.map((q, i) => (
        <QuizQuestion
          key={q.id}
          index={i}
          question={q}
          value={answers[q.id] ?? ''}
          onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
        />
      ))}

      <View style={styles.actions}>
        <AppButton title="Save Draft" icon="💾" variant="ghost" onPress={saveDraft} loading={saving} style={styles.btn} />
        <AppButton title="Submit Offline" icon="✅" variant="success" onPress={submit} loading={saving} style={styles.btn} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  progress: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  btn: { flex: 1 },
});
