import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { EmptyState } from '../../src/components/EmptyState';
import { Chip } from '../../src/components/Chip';
import { Icon } from '../../src/components/Icon';
import { getAssignment } from '../../src/db/repositories/assignmentRepo';
import { getResourcesByIds } from '../../src/db/repositories/resourceRepo';
import { getByAssignment } from '../../src/db/repositories/submissionRepo';
import { LocalAssignment } from '../../src/types/assignment';
import { LocalResource } from '../../src/types/resource';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
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
      <Screen header={<AppBar title="Lesson" role="student" back />}>
        <EmptyState icon="lessons" title="Lesson not found" message="Try pulling lessons again from the hub." />
      </Screen>
    );
  }

  return (
    <Screen header={<AppBar title="Lesson" role="student" back />}>
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
              <View style={styles.resourceTitleRow}>
                <Icon name="resource" size={18} color={colors.navy} />
                <Text style={styles.resourceTitle}>{r.title}</Text>
              </View>
              <Chip label="Offline" color={colors.success} bg={colors.successSoft} icon="offlinePin" />
            </View>
            <Text style={styles.lessonText}>{r.textContent ?? 'No text content.'}</Text>
          </AppCard>
        ))
      )}

      <AppButton
        title={alreadyDone ? 'Review / Retake Quiz' : 'Start Quiz'}
        icon="quiz"
        onPress={() => router.push({ pathname: '/student/quiz', params: { id: assignment.id } })}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text, marginBottom: spacing.md },
  instructionsLabel: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.navy, marginBottom: spacing.xs },
  instructions: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 22 },
  readingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  resourceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  resourceTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, flex: 1 },
  lessonText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 24 },
  noContent: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
