import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { radius, spacing, shadow } from '../theme/spacing';
import { QuizQuestion as QuizQuestionType } from '../types/quiz';

interface Props {
  index: number;
  question: QuizQuestionType;
  value: string;
  onChange: (value: string) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuizQuestion({ index, question, value, onChange }: Props) {
  const mc = question.type === 'multiple_choice';
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.marks}>
          {question.marks} mark{question.marks === 1 ? '' : 's'} · {mc ? 'Multiple choice' : 'Short answer'}
        </Text>
      </View>
      <Text style={styles.question}>{question.question}</Text>

      {mc ? (
        <View style={styles.options}>
          {question.options.map((opt, i) => {
            const selected = value === opt;
            return (
              <Pressable
                key={`${question.id}-${i}`}
                onPress={() => onChange(opt)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View style={[styles.letter, selected && styles.letterSelected]}>
                  {selected ? (
                    <Icon name="check" size={16} color={colors.textInverse} />
                  ) : (
                    <Text style={styles.letterText}>{LETTERS[i] ?? i + 1}</Text>
                  )}
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
          placeholderTextColor={colors.textFaint}
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
    ...shadow.card,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.textInverse, fontFamily: fonts.extrabold, fontSize: 13 },
  marks: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  question: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, marginBottom: spacing.md, lineHeight: 23 },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  optionSelected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterSelected: { borderColor: colors.blue, backgroundColor: colors.blue },
  letterText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  optionText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, flex: 1 },
  optionTextSelected: { fontFamily: fonts.semibold, color: colors.navy },
  input: {
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
