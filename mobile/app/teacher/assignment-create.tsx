import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { Icon } from '../../src/components/Icon';
import { useAuthStore } from '../../src/state/useAuthStore';
import { api } from '../../src/services/apiClient';
import { ResourcePublic } from '../../src/types/resource';
import { QuizQuestion } from '../../src/types/quiz';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';

interface ClassRow {
  id: string;
  name: string;
  class_code: string;
}

export default function AssignmentCreate() {
  const params = useLocalSearchParams<{ classroomId?: string; resourceId?: string; resourceTitle?: string }>();
  const user = useAuthStore((s) => s.user);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [resources, setResources] = useState<ResourcePublic[]>([]);
  const [classroomId, setClassroomId] = useState<string | undefined>(params.classroomId);
  const [resourceId, setResourceId] = useState<string | undefined>(params.resourceId);

  const [title, setTitle] = useState(params.resourceTitle ? `${params.resourceTitle} Quiz` : '');
  const [instructions, setInstructions] = useState('Read the lesson, then answer the quiz.');
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.hubUrl) return;
    try {
      const [{ classrooms }, { resources: res }] = await Promise.all([
        api.listClassrooms(user.hubUrl, user.id),
        api.listResources(user.hubUrl),
      ]);
      setClasses(classrooms);
      setResources(res);
      if (!classroomId && classrooms[0]) setClassroomId(classrooms[0].id);
    } catch (err) {
      Alert.alert('Cannot reach hub', (err as Error).message);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const generateQuiz = async () => {
    if (!user?.hubUrl || !resourceId) {
      Alert.alert('Pick a resource', 'Choose the lesson to build the quiz from.');
      return;
    }
    setGenerating(true);
    try {
      const result = await api.generateQuiz(user.hubUrl, resourceId, 5);
      setQuestions(result.questions);
      if (!title) {
        const r = resources.find((x) => x.id === resourceId);
        if (r) setTitle(`${r.title} Quiz`);
      }
    } catch (err) {
      Alert.alert('Gemma quiz failed', (err as Error).message);
    }
    setGenerating(false);
  };

  const removeQuestion = (id: string) => {
    setQuestions((qs) => (qs ? qs.filter((q) => q.id !== id) : qs));
  };

  const publish = async () => {
    if (!user?.hubUrl || !classroomId) {
      Alert.alert('Pick a classroom', 'Choose which class gets this assignment.');
      return;
    }
    if (!questions || questions.length === 0) {
      Alert.alert('Generate a quiz first', 'Tap "Generate with Gemma" to create questions.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Add a title', 'Give the assignment a title.');
      return;
    }
    setPublishing(true);
    try {
      await api.createAssignment(user.hubUrl, {
        classroomId,
        title: title.trim(),
        instructions,
        resourceIds: resourceId ? [resourceId] : [],
        quiz: { questions },
        publish: true,
      });
      Alert.alert('Published', 'Students can now download this assignment.');
      router.replace('/teacher/dashboard');
    } catch (err) {
      Alert.alert('Publish failed', (err as Error).message);
    }
    setPublishing(false);
  };

  return (
    <Screen header={<AppBar title="Create Assignment" role="teacher" back />}>
      <AppCard>
        <Text style={styles.step}>1 · Classroom</Text>
        <View style={styles.chips}>
          {classes.map((c) => (
            <SelectChip key={c.id} label={c.name} active={classroomId === c.id} onPress={() => setClassroomId(c.id)} />
          ))}
          {classes.length === 0 ? <Text style={styles.muted}>No classrooms yet — create one first.</Text> : null}
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.step}>2 · Lesson resource</Text>
        <View style={styles.chips}>
          {resources.map((r) => (
            <SelectChip key={r.id} label={r.title} active={resourceId === r.id} onPress={() => setResourceId(r.id)} />
          ))}
          {resources.length === 0 ? <Text style={styles.muted}>No resources yet — import a pack in Library.</Text> : null}
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.step}>3 · Generate quiz</Text>
        <AppButton title="Generate with Gemma" icon="ai" accent={colors.navy} onPress={generateQuiz} loading={generating} />
        {questions ? (
          <View style={styles.reviewBanner}>
            <Icon name="warning" size={16} color={colors.warning} />
            <Text style={styles.reviewText}>Teacher review required — check the AI questions before publishing.</Text>
          </View>
        ) : null}
      </AppCard>

      {questions
        ? questions.map((q, i) => (
            <AppCard key={q.id} accent={colors.blue}>
              <View style={styles.qHeader}>
                <Text style={styles.qType}>
                  Q{i + 1} · {q.type === 'multiple_choice' ? 'Multiple choice' : 'Short answer'} · {q.marks} mark
                  {q.marks === 1 ? '' : 's'}
                </Text>
                <Pressable onPress={() => removeQuestion(q.id)} hitSlop={8}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
              <Text style={styles.qText}>{q.question}</Text>
              {q.type === 'multiple_choice' ? (
                q.options.map((o, oi) => (
                  <View key={oi} style={styles.optionRow}>
                    <Icon
                      name={o === q.answer ? 'check' : 'chevron'}
                      size={15}
                      color={o === q.answer ? colors.success : colors.outlineVariant}
                    />
                    <Text style={[styles.option, o === q.answer && styles.optionCorrect]}>{o}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.answer}>Model answer: {q.answer}</Text>
              )}
            </AppCard>
          ))
        : null}

      {questions ? (
        <AppCard>
          <Text style={styles.step}>4 · Details & publish</Text>
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Assignment title" accent={colors.navy} />
          <TextField label="Instructions" value={instructions} onChangeText={setInstructions} multiline accent={colors.navy} />
          <AppButton title="Publish Assignment" icon="publish" variant="success" onPress={publish} loading={publishing} />
        </AppCard>
      ) : null}
    </Screen>
  );
}

function SelectChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  step: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.navy, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.navy, backgroundColor: colors.navySoft },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  chipTextActive: { fontFamily: fonts.bold, color: colors.navy },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  reviewText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.warning, lineHeight: 18 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  qType: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },
  remove: { fontFamily: fonts.bold, fontSize: 13, color: colors.danger },
  qText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginBottom: spacing.sm, lineHeight: 21 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  option: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, flex: 1 },
  optionCorrect: { fontFamily: fonts.bold, color: colors.success },
  answer: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.xs },
});
