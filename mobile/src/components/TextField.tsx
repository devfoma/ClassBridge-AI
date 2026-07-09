import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, KeyboardTypeOptions } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface Props {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoFocus?: boolean;
  hint?: string;
  accent?: string;
  secureTextEntry?: boolean;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType,
  multiline,
  autoFocus,
  hint,
  accent = colors.blue,
  secureTextEntry,
}: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          { borderColor: focused ? accent : colors.outlineVariant, borderWidth: focused ? 1.8 : 1 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        multiline={multiline}
        autoFocus={autoFocus}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  input: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    minHeight: 52,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top', paddingTop: spacing.md },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginTop: spacing.xs, lineHeight: 16 },
});
