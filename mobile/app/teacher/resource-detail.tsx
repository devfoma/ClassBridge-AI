import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { Chip } from '../../src/components/Chip';
import { EmptyState } from '../../src/components/EmptyState';
import { Icon } from '../../src/components/Icon';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { ResourcePublic } from '../../src/types/resource';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function ResourceDetail() {
  const params = useLocalSearchParams<{ id: string; title?: string }>();
  const user = useAuthStore((s) => s.user);
  const [resource, setResource] = useState<ResourcePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.hubUrl || !params.id) return;
    setRefreshing(true);
    try {
      const { resource: r } = await api.getResource(user.hubUrl, params.id);
      setResource(r);
    } catch (err) {
      Alert.alert('Cannot load resource', (err as Error).message);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user, params.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const summarize = async () => {
    if (!user?.hubUrl || !params.id) return;
    setSummarizing(true);
    try {
      await api.summarize(user.hubUrl, params.id);
      await load(); // Re-fetch so the stored summary shows in full below.
    } catch (err) {
      Alert.alert('Gemma summary failed', (err as Error).message);
    }
    setSummarizing(false);
  };

  const meta = resource
    ? [resource.subject, resource.level].filter(Boolean).join(' · ')
    : '';

  return (
    <Screen
      header={<AppBar title="Resource" role="teacher" back />}
      onRefresh={load}
      refreshing={refreshing}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.navy} />
        </View>
      ) : !resource ? (
        <EmptyState
          icon="library"
          title="Resource not found"
          message="It may have been removed. Pull to refresh or go back to the library."
        />
      ) : (
        <>
          <Text style={styles.title}>{resource.title}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}

          {/* AI summary — shown in full (no line clamp). */}
          <AppCard accent={colors.blue} style={styles.block}>
            <View style={styles.blockHeader}>
              <Icon name="ai" size={18} color={colors.blue} />
              <Text style={styles.blockTitle}>AI Summary</Text>
            </View>
            {resource.summary ? (
              <Text style={styles.body}>{resource.summary}</Text>
            ) : (
              <>
                <Chip
                  label="No AI summary yet"
                  color={colors.warning}
                  bg={colors.warningSoft}
                  icon="ai"
                  style={styles.pending}
                />
                <Text style={styles.hint}>
                  Tap “Summarize” below to generate one with Gemma.
                </Text>
              </>
            )}
          </AppCard>

          {/* Full lesson text so the teacher can read the whole resource. */}
          <AppCard accent={colors.navy} style={styles.block}>
            <View style={styles.blockHeader}>
              <Icon name="resource" size={18} color={colors.navy} />
              <Text style={styles.blockTitle}>Full text</Text>
            </View>
            {resource.textContent ? (
              <Text style={styles.body}>{resource.textContent}</Text>
            ) : (
              <Text style={styles.hint}>
                {resource.hasFile
                  ? 'This resource is a file with no extracted text preview.'
                  : 'No text content available for this resource.'}
              </Text>
            )}
          </AppCard>

          <AppButton
            title={resource.summary ? 'Re-summarize' : 'Summarize'}
            icon="ai"
            variant="secondary"
            accent={colors.navy}
            onPress={summarize}
            loading={summarizing}
          />
          <AppButton
            title="Make Quiz"
            icon="quiz"
            onPress={() =>
              router.push({
                pathname: '/teacher/assignment-create',
                params: { resourceId: resource.id, resourceTitle: resource.title },
              })
            }
            style={{ marginTop: spacing.md }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: spacing.xl * 2, alignItems: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text, marginBottom: spacing.xs },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  block: { marginBottom: spacing.md },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  blockTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 24 },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: spacing.sm },
  pending: { alignSelf: 'flex-start' },
});
