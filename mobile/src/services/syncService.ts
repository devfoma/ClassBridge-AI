import { LocalUser } from '../types/user';
import { PushSubmissionInput } from '../types/sync';
import { api } from './apiClient';
import { nowIso } from '../utils/dates';
import * as submissionRepo from '../db/repositories/submissionRepo';
import * as assignmentRepo from '../db/repositories/assignmentRepo';
import * as classroomRepo from '../db/repositories/classroomRepo';
import * as syncRepo from '../db/repositories/syncRepo';
import { saveResourcesForOffline } from './resourceDownloadService';

export interface SyncResult {
  pushed: number;
  pulledAssignments: number;
  pulledResources: number;
  serverTime: string;
}

/**
 * Two-way sync for a student device:
 * 1. Push any completed-but-unsynced submissions and apply the returned grades.
 * 2. Pull the latest classrooms/assignments/resources and store them offline.
 *
 * Conflict rules are simple: the student only writes submissions, the hub only
 * writes assignments/feedback, so there is nothing to merge.
 */
export async function syncStudentData(user: LocalUser, classroomId?: string): Promise<SyncResult> {
  if (!user.hubUrl) throw new Error('No hub URL set. Add it in Settings.');

  // --- 1. Push pending submissions ---
  const pending = await submissionRepo.getPending();
  let pushed = 0;

  if (pending.length > 0) {
    const ids = pending.map((s) => s.id);
    await submissionRepo.setStatus(ids, 'syncing');
    try {
      const payload: PushSubmissionInput[] = pending.map((s) => ({
        id: s.id,
        assignmentId: s.assignmentId,
        answers: s.answers,
        submittedAt: s.createdAt,
      }));
      const result = await api.push(user.hubUrl, user.id, user.deviceId, payload);

      const syncedAt = nowIso();
      for (const fb of result.feedback) {
        await submissionRepo.applyFeedback(fb.submissionId, fb.score, fb.maxScore, fb.feedback, syncedAt);
      }
      // Any pushed id not present in feedback is still marked synced.
      const gradedIds = new Set(result.feedback.map((f) => f.submissionId));
      const remaining = result.syncedSubmissionIds.filter((id) => !gradedIds.has(id));
      if (remaining.length) await submissionRepo.setStatus(remaining, 'synced');
      pushed = result.syncedSubmissionIds.length;
    } catch (err) {
      await submissionRepo.setStatus(ids, 'sync_failed');
      throw err;
    }
  }

  // --- 2. Pull updates ---
  const since = await syncRepo.getLastSyncTime();
  const updates = await api.pull(user.hubUrl, user.id, classroomId, since ?? undefined);

  for (const c of updates.classrooms) {
    await classroomRepo.upsertClassroom({
      id: c.id,
      name: c.name,
      classCode: c.class_code ?? c.classCode ?? null,
      lastSyncedAt: updates.serverTime,
    });
  }

  for (const a of updates.assignments) {
    await assignmentRepo.upsertAssignment({
      id: a.id,
      classroomId: a.classroomId,
      title: a.title,
      instructions: a.instructions,
      quiz: a.quiz,
      resourceIds: a.resourceIds,
      downloadedAt: null,
    });
  }

  await saveResourcesForOffline(user.hubUrl, updates.resources);

  await syncRepo.setLastSyncTime(updates.serverTime);

  return {
    pushed,
    pulledAssignments: updates.assignments.length,
    pulledResources: updates.resources.length,
    serverTime: updates.serverTime,
  };
}

/** Pull only (used when joining a class or refreshing lessons). */
export async function pullOnly(user: LocalUser, classroomId?: string): Promise<SyncResult> {
  if (!user.hubUrl) throw new Error('No hub URL set. Add it in Settings.');
  const updates = await api.pull(user.hubUrl, user.id, classroomId);

  for (const c of updates.classrooms) {
    await classroomRepo.upsertClassroom({
      id: c.id,
      name: c.name,
      classCode: c.class_code ?? c.classCode ?? null,
      lastSyncedAt: updates.serverTime,
    });
  }
  for (const a of updates.assignments) {
    await assignmentRepo.upsertAssignment({
      id: a.id,
      classroomId: a.classroomId,
      title: a.title,
      instructions: a.instructions,
      quiz: a.quiz,
      resourceIds: a.resourceIds,
      downloadedAt: null,
    });
  }
  await saveResourcesForOffline(user.hubUrl, updates.resources);
  await syncRepo.setLastSyncTime(updates.serverTime);

  return {
    pushed: 0,
    pulledAssignments: updates.assignments.length,
    pulledResources: updates.resources.length,
    serverTime: updates.serverTime,
  };
}
