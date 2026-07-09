import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import QRCodeBase, { type QRCodeProps } from 'react-native-qrcode-svg';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { EmptyState } from '../../src/components/EmptyState';
import { Icon } from '../../src/components/Icon';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { encodeJoinPayload } from '../../src/utils/joinQr';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

// react-native-qrcode-svg's bundled types predate React 19's stricter JSX typing,
// so its default export isn't recognized as a valid JSX component. Cast it back to a
// component type while preserving the library's real prop types.
const QRCode = QRCodeBase as unknown as React.ComponentType<QRCodeProps>;

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
    <Screen
      header={<AppBar title="Classrooms" role="teacher" back />}
      onRefresh={load}
      refreshing={refreshing}
    >
      <AppCard>
        <Text style={styles.cardTitle}>Create a classroom</Text>
        <TextField
          label="Class name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. JSS2 Basic Science"
          accent={colors.navy}
        />
        <AppButton title="Create Classroom" icon="add" onPress={create} loading={creating} accent={colors.navy} />
      </AppCard>

      {rows.length === 0 ? (
        <EmptyState
          icon="classroom"
          title="No classrooms yet"
          message="Create your first classroom above to get a join code."
        />
      ) : (
        rows.map((c) => (
          <AppCard
            key={c.id}
            accent={colors.navy}
            onPress={() =>
              router.push({
                pathname: '/teacher/classroom-detail',
                params: { id: c.id, name: c.name, code: c.class_code },
              })
            }
          >
            <Text style={styles.className}>{c.name}</Text>
            <View style={styles.codeRow}>
              <View style={styles.codePill}>
                <Icon name="key" size={15} color={colors.navy} />
                <Text style={styles.codeText}>{c.class_code}</Text>
              </View>
              <Pressable
                style={styles.qr}
                onPress={() =>
                  router.push({ pathname: '/teacher/class-qr', params: { name: c.name, code: c.class_code } })
                }
              >
                <QRCode value={encodeJoinPayload(user?.hubUrl ?? '', c.class_code)} size={60} backgroundColor="white" color={colors.navy} />
              </Pressable>
            </View>
            <Text style={styles.hint}>Tap the QR to enlarge for students to scan.</Text>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: spacing.md },
  className: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: spacing.md },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navySoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  codeText: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.navy, letterSpacing: 2 },
  qr: { backgroundColor: 'white', padding: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginTop: spacing.md },
});
