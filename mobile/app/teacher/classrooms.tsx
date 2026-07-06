import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

interface Row {
  id: string;
  name: string;
  class_code: string;
}

export default function Classrooms() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.hubUrl) return;
    setRefreshing(true);
    try {
      const { classrooms } = await api.listClassrooms(user.hubUrl, user.id);
      setRows(classrooms);
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

  const create = async () => {
    if (!user?.hubUrl) {
      Alert.alert('Set hub URL first', 'Open Settings and enter the hub URL.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Name required', 'Give the classroom a name.');
      return;
    }
    setCreating(true);
    try {
      const created = await api.createClassroom(user.hubUrl, user.id, name.trim());
      setName('');
      Alert.alert('Classroom created', `Class code: ${created.classCode}`);
      await load();
    } catch (err) {
      Alert.alert('Could not create classroom', (err as Error).message);
    }
    setCreating(false);
  };

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <AppCard>
        <Text style={styles.cardTitle}>Create a classroom</Text>
        <TextField label="Class name" value={name} onChangeText={setName} placeholder="e.g. JSS2 Basic Science" />
        <AppButton title="Create Classroom" icon="＋" onPress={create} loading={creating} />
      </AppCard>

      <Text style={styles.section}>Your classrooms</Text>
      {rows.length === 0 ? (
        <EmptyState icon="🏫" title="No classrooms yet" message="Create your first classroom above to get a join code." />
      ) : (
        rows.map((c) => (
          <AppCard key={c.id} accent={colors.navy} onPress={() => router.push({ pathname: '/teacher/classroom-detail', params: { id: c.id, name: c.name, code: c.class_code } })}>
            <Text style={styles.className}>{c.name}</Text>
            <View style={styles.codeRow}>
              <View style={styles.codePill}>
                <Text style={styles.codeText}>{c.class_code}</Text>
              </View>
              <View style={styles.qr}>
                <QRCode
                  value={JSON.stringify({ hubUrl: user?.hubUrl ?? '', classCode: c.class_code })}
                  size={64}
                  backgroundColor="white"
                  color={colors.navy}
                />
              </View>
            </View>
            <Text style={styles.hint}>
              Students join with this code. Hub URL: {user?.hubUrl ?? 'set in Settings'}
            </Text>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.md },
  className: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codePill: {
    backgroundColor: colors.blueSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  codeText: { fontSize: 20, fontWeight: '900', color: colors.navy, letterSpacing: 2 },
  qr: { backgroundColor: 'white', padding: 4, borderRadius: 8 },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md },
});
