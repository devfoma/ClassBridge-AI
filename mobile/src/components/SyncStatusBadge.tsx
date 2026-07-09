import React from 'react';
import { Chip } from './Chip';
import { Icon, IconName } from './Icon';
import { colors } from '../theme/colors';
import { SubmissionStatus } from '../types/submission';
import { STATUS_LABEL } from '../services/submissionStatus';

const STYLE: Record<SubmissionStatus, { fg: string; bg: string; icon: IconName }> = {
  draft: { fg: colors.info, bg: colors.infoSoft, icon: 'pending' },
  completed_unsynced: { fg: colors.warning, bg: colors.warningSoft, icon: 'cloudOff' },
  syncing: { fg: colors.blue, bg: colors.blueSoft, icon: 'cloudSync' },
  synced: { fg: colors.success, bg: colors.successSoft, icon: 'cloudDone' },
  sync_failed: { fg: colors.danger, bg: colors.dangerSoft, icon: 'error' },
};

export function SyncStatusBadge({ status }: { status: SubmissionStatus }) {
  const s = STYLE[status];
  return <Chip label={STATUS_LABEL[status]} color={s.fg} bg={s.bg} icon={s.icon} />;
}

/** Generic hub connection badge. */
export function HubStatusBadge({ online }: { online: boolean }) {
  return (
    <Chip
      label={online ? 'Local Hub Connected' : 'Hub Offline'}
      color={online ? colors.success : colors.danger}
      bg={online ? colors.successSoft : colors.dangerSoft}
      icon={online ? 'online' : 'offline'}
    />
  );
}

/** Re-export for convenience where an inline icon is needed alongside text. */
export { Icon };
