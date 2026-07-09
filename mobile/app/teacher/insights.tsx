import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

interface ClassRow {
  id: string;
  name: string;
}
interface Insight {
  summary: string;
  commonMisconceptions: string[];
  recommendedRevision: string;
  nextActivity: string;
}

export default function Insights() {
  const params = useLocalSearchParams<{ classroomId?: string }>();
  const user = useAuthStore((s) => s.user);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classroomId, setClassroomId] = useState<string | undefined>(params.classroomId);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);

  const loadClasses = useCallback(async () => {
    if (!user?.hubUrl) return;
    try {
      const { classrooms } = await api.listClassrooms(user.hubUrl, user.id);
      setClasses(classrooms);
      if (!classroomId && classrooms[0]) setClassroomId(classrooms[0].id);
    } catch (err) {
      Alert.alert('Cannot reach hub', (err as Error).message);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses])
  );

  const generate = async () => {
    if (!user?.hubUrl || !classroomId) return;
    setLoading(true);
    try {
      const result = await api.classroomInsight(user.hubUrl, classroomId);
      setInsight(result);
    } catch (err) {
      Alert.alert('Insight failed', (err as Error).message);
    }
    setLoading(false);
  };

  return (
    <Screen header={<AppBar title="AI Insights" role="teacher" back />}>
      {classes.length > 1 ? (
        <View style={styles.chips}>
          {classes.map((c) => {
            const active = classroomId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setClassroomId(c.id);
                  setInsight(null);
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <AppButton title="Generate with Gemma" icon="ai" accent={colors.navy} onPress={generate} loading={loading} />

      {!insight ? (
        <View style={{ marginTop: spacing.lg }}>
          <EmptyState
            icon="insight"
            title="AI class insights"
            message="Tap the button to have Gemma analyse student submissions and suggest what to reteach."
          />
        </View>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          <AppCard accent={colors.blue}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.body}>{insight.summary}</Text>
          </AppCard>

          <AppCard accent={colors.warning}>
            <Text style={styles.sectionTitle}>Common misconceptions</Text>
            {insight.commonMisconceptions.length === 0 ? (
              <Text style={styles.body}>None detected 🎉</Text>
            ) : (
              insight.commonMisconceptions.map((m, i) => (
                <Text key={i} style={styles.bullet}>
                  • {m}
                </Text>
              ))
            )}
          </AppCard>

          <AppCard accent={colors.success}>
            <Text style={styles.sectionTitle}>Recommended revision</Text>
            <Text style={styles.body}>{insight.recommendedRevision}</Text>
          </AppCard>

          <AppCard accent={colors.navy}>
            <Text style={styles.sectionTitle}>Suggested next activity</Text>
            <Text style={styles.body}>{insight.nextActivity}</Text>
          </AppCard>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.navy, backgroundColor: colors.navySoft },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  chipTextActive: { fontFamily: fonts.bold, color: colors.navy },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text, marginBottom: spacing.sm },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, lineHeight: 21 },
  bullet: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, lineHeight: 22 },
});
