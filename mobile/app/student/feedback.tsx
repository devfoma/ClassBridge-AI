import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/AppCard';
import { SubmissionCard } from '../../src/components/SubmissionCard';
import { EmptyState } from '../../src/components/EmptyState';
import { listSynced } from '../../src/db/repositories/submissionRepo';
import { getAssignment } from '../../src/db/repositories/assignmentRepo';
import { LocalSubmission } from '../../src/types/submission';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

interface Row extends LocalSubmission {
  title: string;
}

export default function Feedback() {
  const [rows, setRows] = useState<Row[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const synced = await listSynced();
    const withTitles: Row[] = [];
    for (const s of synced) {
      const a = await getAssignment(s.assignmentId);
      withTitles.push({ ...s, title: a?.title ?? 'Quiz' });
    }
    setRows(withTitles);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      {rows.length === 0 ? (
        <EmptyState
          icon="🏅"
          title="No feedback yet"
          message="Complete a quiz and sync it. Your scores and AI feedback will appear here."
        />
      ) : (
        rows.map((s) => (
          <View key={s.id}>
            <SubmissionCard
              title={s.title}
              status={s.status}
              score={s.score}
              maxScore={s.maxScore}
              onPress={() => setExpanded(expanded === s.id ? null : s.id)}
            />
            {expanded === s.id && s.feedback ? (
              <AppCard style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>AI Feedback</Text>
                {s.feedback.map((f, i) => (
                  <View key={i} style={styles.item}>
                    <Text style={styles.score}>
                      {f.score}/{f.maxScore} marks
                    </Text>
                    <Text style={styles.text}>{f.feedback}</Text>
                    {f.misconception ? <Text style={styles.misc}>💡 {f.misconception}</Text> : null}
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
  feedbackCard: { marginTop: -spacing.sm, backgroundColor: colors.infoSoft },
  feedbackTitle: { fontSize: 14, fontWeight: '800', color: colors.navy, marginBottom: spacing.sm },
  item: { marginBottom: spacing.md },
  score: { fontSize: 13, fontWeight: '800', color: colors.blue },
  text: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 2 },
  misc: { fontSize: 13, color: colors.warning, marginTop: 2, fontStyle: 'italic' },
});
