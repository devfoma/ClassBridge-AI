import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { SyncStatusBadge } from './SyncStatusBadge';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { SubmissionStatus } from '../types/submission';

interface Props {
  title: string;
  studentName?: string;
  status?: SubmissionStatus;
  score: number | null;
  maxScore: number | null;
  onPress?: () => void;
}

export function SubmissionCard({ title, studentName, status, score, maxScore, onPress }: Props) {
  const hasScore = score != null && maxScore != null;
  const pct = hasScore && maxScore ? Math.round((score! / maxScore!) * 100) : null;
  const scoreColor =
    pct == null ? colors.textFaint : pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger;

  return (
    <AppCard onPress={onPress} accent={scoreColor}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.title}>{title}</Text>
          {studentName ? <Text style={styles.meta}>{studentName}</Text> : null}
        </View>
        <View style={styles.scoreWrap}>
          <Text style={[styles.score, { color: scoreColor }]}>{hasScore ? `${score}/${maxScore}` : '—'}</Text>
          {pct != null ? <Text style={styles.pct}>{pct}%</Text> : null}
        </View>
      </View>
      {status ? (
        <View style={styles.badgeRow}>
          <SyncStatusBadge status={status} />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scoreWrap: { alignItems: 'flex-end', marginLeft: spacing.md },
  score: { fontFamily: fonts.extrabold, fontSize: 20 },
  pct: { fontFamily: fonts.medium, fontSize: 12, color: colors.textFaint },
  badgeRow: { marginTop: spacing.md },
});
