import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { QuizQuestion as QuizQuestionType } from '../types/quiz';

interface Props {
  index: number;
  question: QuizQuestionType;
  value: string;
  onChange: (value: string) => void;
}

export function QuizQuestion({ index, question, value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.marks}>
          {question.marks} mark{question.marks === 1 ? '' : 's'} ·{' '}
          {question.type === 'multiple_choice' ? 'Multiple choice' : 'Short answer'}
        </Text>
      </View>
      <Text style={styles.question}>{question.question}</Text>

      {question.type === 'multiple_choice' ? (
        <View style={styles.options}>
          {question.options.map((opt, i) => {
            const selected = value === opt;
            return (
              <Pressable
                key={`${question.id}-${i}`}
                onPress={() => onChange(opt)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="Type your answer…"
          placeholderTextColor={colors.textMuted}
          multiline
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  badgeText: { color: colors.textInverse, fontWeight: '800', fontSize: 13 },
  marks: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  question: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md, lineHeight: 22 },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionSelected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.blue },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  optionText: { fontSize: 15, color: colors.text, flex: 1 },
  optionTextSelected: { fontWeight: '700', color: colors.navy },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
