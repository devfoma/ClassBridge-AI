import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { SubmissionStatus } from '../types/submission';
import { STATUS_LABEL } from '../services/submissionStatus';

const STYLE: Record<SubmissionStatus, { bg: string; fg: string; dot: string }> = {
  draft: { bg: colors.infoSoft, fg: colors.info, dot: colors.info },
  completed_unsynced: { bg: colors.warningSoft, fg: colors.warning, dot: colors.warning },
  syncing: { bg: colors.blueSoft, fg: colors.blue, dot: colors.blue },
  synced: { bg: colors.successSoft, fg: colors.success, dot: colors.success },
  sync_failed: { bg: colors.dangerSoft, fg: colors.danger, dot: colors.danger },
};

export function SyncStatusBadge({ status }: { status: SubmissionStatus }) {
  const s = STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Text style={[styles.text, { color: s.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

/** Generic hub connection badge. */
export function HubStatusBadge({ online }: { online: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: online ? colors.successSoft : colors.dangerSoft }]}>
      <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.danger }]} />
      <Text style={[styles.text, { color: online ? colors.success : colors.danger }]}>
        {online ? 'Local Hub Connected' : 'Hub Offline'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  text: { fontSize: 12, fontWeight: '700' },
});
