import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { SubmissionCard } from '../../src/components/SubmissionCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Icon } from '../../src/components/Icon';
import { listSynced } from '../../src/db/repositories/submissionRepo';
import { getAssignment } from '../../src/db/repositories/assignmentRepo';
import { LocalSubmission } from '../../src/types/submission';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
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
    <Screen header={<AppBar title="My Feedback" role="student" back />} onRefresh={load} refreshing={refreshing}>
      {rows.length === 0 ? (
        <EmptyState
          icon="feedback"
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
              <AppCard style={styles.feedbackCard} elevated={false}>
                <View style={styles.feedbackHead}>
                  <Icon name="ai" size={16} color={colors.navy} />
                  <Text style={styles.feedbackTitle}>AI Feedback</Text>
                </View>
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
  feedbackCard: { marginTop: -spacing.sm, backgroundColor: colors.infoSoft, borderColor: colors.blueSoft },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  feedbackTitle: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.navy },
  item: { marginBottom: spacing.md },
  score: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.blue },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 2 },
  misc: { fontFamily: fonts.regular, fontSize: 13, color: colors.warning, marginTop: 2, fontStyle: 'italic' },
});
