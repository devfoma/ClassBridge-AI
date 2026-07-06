import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { StatCard } from '../../src/components/StatCard';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function ClassroomDetail() {
  const params = useLocalSearchParams<{ id: string; name?: string; code?: string }>();
  const user = useAuthStore((s) => s.user);
  const [members, setMembers] = useState(0);
  const [assignments, setAssignments] = useState(0);
  const [pending, setPending] = useState(0);
  const [name, setName] = useState(params.name ?? 'Class');
  const [code, setCode] = useState(params.code ?? '');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.hubUrl || !params.id) return;
    setRefreshing(true);
    try {
      const { classroom } = await api.getClassroom(user.hubUrl, params.id);
      setName(classroom.name);
      setCode(classroom.class_code);
      setMembers(classroom.members.length);
      setAssignments(classroom.assignmentsCount);
      setPending(classroom.pendingSubmissionsCount);
    } catch {
      // keep params values
    }
    setRefreshing(false);
  }, [user, params.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <AppCard accent={colors.navy}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.codePill}>
          <Text style={styles.codeText}>{code}</Text>
        </View>
      </AppCard>

      <View style={styles.statsRow}>
        <StatCard label="Students" value={members} icon="🧑🏽‍🎓" accent={colors.navy} />
        <View style={{ width: spacing.md }} />
        <StatCard label="Assignments" value={assignments} icon="📝" accent={colors.blue} />
        <View style={{ width: spacing.md }} />
        <StatCard label="Pending" value={pending} icon="⏳" accent={colors.warning} />
      </View>

      <AppButton
        title="Create Assignment"
        icon="📝"
        onPress={() => router.push({ pathname: '/teacher/assignment-create', params: { classroomId: params.id, classroomName: name } })}
      />
      <AppButton
        title="View Submissions"
        icon="📥"
        variant="secondary"
        onPress={() => router.push({ pathname: '/teacher/submissions', params: { classroomId: params.id } })}
        style={{ marginTop: spacing.md }}
      />
      <AppButton
        title="Class Insights"
        icon="🧠"
        variant="ghost"
        onPress={() => router.push({ pathname: '/teacher/insights', params: { classroomId: params.id } })}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  codePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blueSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  codeText: { fontSize: 20, fontWeight: '900', color: colors.navy, letterSpacing: 2 },
  statsRow: { flexDirection: 'row', marginVertical: spacing.md },
});
