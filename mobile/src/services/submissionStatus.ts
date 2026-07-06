import { SubmissionStatus } from '../types/submission';

/**
 * Allowed submission status transitions. Encodes the offline-first lifecycle:
 *   draft -> completed_unsynced -> syncing -> synced
 *   draft -> completed_unsynced -> syncing -> sync_failed -> syncing (retry)
 */
const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  draft: ['draft', 'completed_unsynced'],
  completed_unsynced: ['syncing', 'completed_unsynced'],
  syncing: ['synced', 'sync_failed'],
  sync_failed: ['syncing', 'completed_unsynced'],
  synced: ['synced'],
};

export function canTransition(from: SubmissionStatus, to: SubmissionStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatus(from: SubmissionStatus, to: SubmissionStatus): SubmissionStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid submission transition: ${from} -> ${to}`);
  }
  return to;
}

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  draft: 'Draft',
  completed_unsynced: 'Saved Offline',
  syncing: 'Syncing…',
  synced: 'Synced',
  sync_failed: 'Sync Failed',
};
