import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { StatCard } from '../../src/components/StatCard';
import { Icon } from '../../src/components/Icon';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

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
    <Screen
      header={<AppBar title="Classroom" role="teacher" back />}
      onRefresh={load}
      refreshing={refreshing}
    >
      <AppCard accent={colors.navy}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.codePill}>
          <Icon name="key" size={16} color={colors.navy} />
          <Text style={styles.codeText}>{code}</Text>
        </View>
      </AppCard>

      <View style={styles.statsRow}>
        <StatCard label="Students" value={members} icon="person" accent={colors.navy} accentSoft={colors.navySoft} />
        <StatCard label="Assignments" value={assignments} icon="quiz" accent={colors.blue} accentSoft={colors.blueSoft} />
        <StatCard label="Pending" value={pending} icon="pending" accent={colors.warning} accentSoft={colors.warningSoft} />
      </View>

      <AppButton
        title="Show Join QR"
        icon="qr"
        accent={colors.navy}
        onPress={() => router.push({ pathname: '/teacher/class-qr', params: { name, code } })}
      />
      <AppButton
        title="Create Assignment"
        icon="add"
        accent={colors.navy}
        onPress={() =>
          router.push({ pathname: '/teacher/assignment-create', params: { classroomId: params.id, classroomName: name } })
        }
        style={{ marginTop: spacing.md }}
      />
      <AppButton
        title="View Submissions"
        icon="submissions"
        variant="secondary"
        accent={colors.navy}
        onPress={() => router.push({ pathname: '/teacher/submissions', params: { classroomId: params.id } })}
        style={{ marginTop: spacing.md }}
      />
      <AppButton
        title="Class Insights"
        icon="insight"
        variant="ghost"
        onPress={() => router.push({ pathname: '/teacher/insights', params: { classroomId: params.id } })}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text, marginBottom: spacing.md },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.navySoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  codeText: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.navy, letterSpacing: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.md },
});
