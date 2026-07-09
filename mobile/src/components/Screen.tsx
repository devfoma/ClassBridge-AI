import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface Props {
  children: React.ReactNode;
  /** An <AppBar/> element rendered above the scrollable content. */
  header?: React.ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Apply the standard screen padding. Set false for full-bleed layouts. */
  padded?: boolean;
}

/** Standard screen container: optional app-bar + padded, scrollable body. */
export function Screen({
  children,
  header,
  scroll = true,
  onRefresh,
  refreshing,
  contentStyle,
  padded = true,
}: Props) {
  const inner = scroll ? (
    <ScrollView
      style={styles.grow}
      contentContainerStyle={[styles.contentContainer, padded && styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.blue} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.grow, padded && styles.content, contentStyle]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      {header}
      <KeyboardAvoidingView
        style={styles.grow}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {header ? (
          inner
        ) : (
          <SafeAreaView style={styles.grow} edges={['top']}>
            {inner}
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grow: { flex: 1, flexGrow: 1 },
  contentContainer: { flexGrow: 1 },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
