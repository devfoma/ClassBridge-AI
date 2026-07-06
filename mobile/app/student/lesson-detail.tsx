import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { EmptyState } from '../../src/components/EmptyState';
import { getAssignment } from '../../src/db/repositories/assignmentRepo';
import { getResourcesByIds } from '../../src/db/repositories/resourceRepo';
import { getByAssignment } from '../../src/db/repositories/submissionRepo';
import { LocalAssignment } from '../../src/types/assignment';
import { LocalResource } from '../../src/types/resource';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function LessonDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const [assignment, setAssignment] = useState<LocalAssignment | null>(null);
  const [resources, setResources] = useState<LocalResource[]>([]);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    const a = await getAssignment(params.id);
    setAssignment(a);
    if (a) {
      const res = await getResourcesByIds(a.resourceIds);
      setResources(res);
      const sub = await getByAssignment(a.id);
      setAlreadyDone(!!sub && sub.status !== 'draft');
    }
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!assignment) {
    return (
      <Screen>
        <EmptyState icon="📖" title="Lesson not found" message="Try pulling lessons again from the hub." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{assignment.title}</Text>
      {assignment.instructions ? (
        <AppCard accent={colors.blue}>
          <Text style={styles.instructionsLabel}>Instructions</Text>
          <Text style={styles.instructions}>{assignment.instructions}</Text>
        </AppCard>
      ) : null}

      {resources.length === 0 ? (
        <AppCard>
          <Text style={styles.noContent}>
            The lesson text was not downloaded. Reconnect to the hub and pull lessons again.
          </Text>
        </AppCard>
      ) : (
        resources.map((r) => (
          <AppCard key={r.id}>
            <View style={styles.readingHeader}>
              <Text style={styles.resourceTitle}>📄 {r.title}</Text>
              <View style={styles.offlinePill}>
                <Text style={styles.offlineText}>Available offline</Text>
              </View>
            </View>
            <Text style={styles.lessonText}>{r.textContent ?? 'No text content.'}</Text>
          </AppCard>
        ))
      )}

      <AppButton
        title={alreadyDone ? 'Review / Retake Quiz' : 'Start Quiz'}
        icon="📝"
        onPress={() => router.push({ pathname: '/student/quiz', params: { id: assignment.id } })}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  instructionsLabel: { fontSize: 13, fontWeight: '800', color: colors.navy, marginBottom: spacing.xs },
  instructions: { fontSize: 15, color: colors.text, lineHeight: 21 },
  readingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  resourceTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  offlinePill: { backgroundColor: colors.successSoft, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 6 },
  offlineText: { fontSize: 11, color: colors.success, fontWeight: '700' },
  lessonText: { fontSize: 15, color: colors.text, lineHeight: 23 },
  noContent: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
