import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { ResourceCard } from '../../src/components/ResourceCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { ResourcePublic } from '../../src/types/resource';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

const PHOTOSYNTHESIS_PACK = '../sample-packs/photosynthesis-pack';
const FRACTIONS_PACK = '../sample-packs/math-fractions-pack';

export default function Library() {
  const user = useAuthStore((s) => s.user);
  const [resources, setResources] = useState<ResourcePublic[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.hubUrl) return;
    setRefreshing(true);
    try {
      const { resources: list } = await api.listResources(user.hubUrl);
      setResources(list);
    } catch (err) {
      Alert.alert('Cannot reach hub', (err as Error).message);
    }
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const importPack = async (packPath: string) => {
    if (!user?.hubUrl) {
      Alert.alert('Set hub URL first', 'Open Settings and enter the hub URL.');
      return;
    }
    setImporting(true);
    try {
      await api.importPack(user.hubUrl, packPath);
      await load();
    } catch (err) {
      Alert.alert('Import failed', (err as Error).message);
    }
    setImporting(false);
  };

  const summarize = async (r: ResourcePublic) => {
    if (!user?.hubUrl) return;
    setBusyId(r.id);
    try {
      const result = await api.summarize(user.hubUrl, r.id);
      Alert.alert('Summary ready', result.summary);
      await load();
    } catch (err) {
      Alert.alert('Gemma summary failed', (err as Error).message);
    }
    setBusyId(null);
  };

  return (
    <Screen
      header={<AppBar title="Library" role="teacher" />}
      onRefresh={load}
      refreshing={refreshing}
    >
      <AppCard>
        <Text style={styles.cardTitle}>Import a sample pack</Text>
        <Text style={styles.cardHint}>These small text lessons live on the hub. Great for a quick demo.</Text>
        <AppButton
          title="Import Photosynthesis Pack"
          icon="download"
          onPress={() => importPack(PHOTOSYNTHESIS_PACK)}
          loading={importing}
          accent={colors.navy}
        />
        <AppButton
          title="Import Fractions Pack"
          icon="download"
          variant="secondary"
          accent={colors.navy}
          onPress={() => importPack(FRACTIONS_PACK)}
          style={{ marginTop: spacing.md }}
        />
        <AppButton
          title="Upload a Text File"
          icon="upload"
          variant="ghost"
          onPress={() => router.push('/teacher/upload-resource')}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>

      <SectionHeader title="Resources" />
      {resources.length === 0 ? (
        <EmptyState
          icon="library"
          title="No resources yet"
          message="Import a sample pack or upload a text file to get started."
        />
      ) : (
        resources.map((r) => (
          <View key={r.id} style={styles.actionRow}>
            <ResourceCard
              title={r.title}
              subject={r.subject}
              level={r.level}
              summary={r.summary}
              right={busyId === r.id ? <ActivityIndicator color={colors.blue} /> : undefined}
            />
            <View style={styles.actions}>
              <AppButton
                title="Summarize"
                icon="ai"
                variant="secondary"
                accent={colors.navy}
                onPress={() => summarize(r)}
                loading={busyId === r.id}
                style={styles.actionBtn}
              />
              <AppButton
                title="Make Quiz"
                icon="quiz"
                onPress={() =>
                  router.push({
                    pathname: '/teacher/assignment-create',
                    params: { resourceId: r.id, resourceTitle: r.title },
                  })
                }
                style={styles.actionBtn}
              />
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: spacing.xs },
  cardHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  actionRow: { marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: -spacing.xs },
  actionBtn: { flex: 1 },
});
