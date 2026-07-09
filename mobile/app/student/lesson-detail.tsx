import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { EmptyState } from '../../src/components/EmptyState';
import { Chip } from '../../src/components/Chip';
import { Icon } from '../../src/components/Icon';
import { getAssignment } from '../../src/db/repositories/assignmentRepo';
import { getResourcesByIds, updateResourceSummary } from '../../src/db/repositories/resourceRepo';
import { getByAssignment } from '../../src/db/repositories/submissionRepo';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { LocalAssignment } from '../../src/types/assignment';
import { LocalResource } from '../../src/types/resource';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

export default function LessonDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [assignment, setAssignment] = useState<LocalAssignment | null>(null);
  const [resources, setResources] = useState<LocalResource[]>([]);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

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

  // Ask Gemma (on the hub) to summarise a resource. Needs a live hub connection;
  // the result is cached locally so it stays readable offline afterwards.
  const askSummary = async (resource: LocalResource) => {
    if (!user?.hubUrl) {
      Alert.alert(
        'Connect to the hub',
        'Set the hub URL in Settings and join the hub Wi-Fi to get an AI summary.'
      );
      return;
    }
    setSummarizingId(resource.id);
    try {
      const { summary } = await api.summarize(user.hubUrl, resource.id);
      await updateResourceSummary(resource.id, summary);
      setResources((prev) =>
        prev.map((r) => (r.id === resource.id ? { ...r, summary } : r))
      );
    } catch (err) {
      Alert.alert(
        'Could not get a summary',
        `${(err as Error).message}\n\nYou need to be connected to the hub to generate one.`
      );
    }
    setSummarizingId(null);
  };

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

      <Text style={styles.readHint}>Read the material below, then start the quiz.</Text>

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

            {r.summary ? (
              <View style={styles.summaryBox}>
                <View style={styles.summaryHeader}>
                  <Icon name="ai" size={16} color={colors.blue} />
                  <Text style={styles.summaryLabel}>AI Summary</Text>
                </View>
                <Text style={styles.summaryText}>{r.summary}</Text>
              </View>
            ) : null}

            <Text style={styles.lessonText}>{r.textContent ?? 'No text content.'}</Text>

            <AppButton
              title={r.summary ? 'Refresh AI summary' : 'Ask AI for a summary'}
              icon="ai"
              variant="ghost"
              onPress={() => askSummary(r)}
              loading={summarizingId === r.id}
              style={{ marginTop: spacing.md }}
            />
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
  readHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  readingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  resourceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  resourceTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, flex: 1 },
  summaryBox: {
    backgroundColor: colors.blueSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  summaryLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue },
  summaryText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, lineHeight: 22 },
  lessonText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 24 },
  noContent: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
