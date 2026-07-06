import { getDb } from '../db';
import { newId } from '../utils/ids';
import { nowIso, isAfter } from '../utils/dates';
import { Classroom } from '../types/classroom';
import { Assignment } from '../types/assignment';
import { Resource } from '../types/resource';
import { PullResponse, PushResponse, PushSubmissionInput, PushFeedback } from '../types/sync';
import { toPublicAssignment, listAssignments } from './assignment.service';
import { toPublicResource } from './resource.service';
import { listClassroomsForStudent } from './classroom.service';
import { ingestSubmission } from './submission.service';

function logSyncEvent(input: {
  deviceId: string;
  entityType: string;
  entityId: string;
  operation: string;
  payload: unknown;
}): void {
  getDb()
    .prepare(
      `INSERT INTO sync_events (id, device_id, entity_type, entity_id, operation, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      newId('evt'),
      input.deviceId,
      input.entityType,
      input.entityId,
      input.operation,
      JSON.stringify(input.payload),
      nowIso()
    );
}

/**
 * Pull down everything a student needs for a classroom (or all their classrooms):
 * classrooms, published assignments and referenced resources (with text so the
 * student can read lessons fully offline). `since` filters by creation time.
 */
export function pullUpdates(input: {
  studentId: string;
  classroomId?: string;
  since?: string;
}): PullResponse {
  const db = getDb();
  const { studentId, classroomId, since } = input;

  let classrooms: Classroom[] = listClassroomsForStudent(studentId);
  if (classroomId) classrooms = classrooms.filter((c) => c.id === classroomId);

  const assignments: Assignment[] = [];
  for (const c of classrooms) {
    assignments.push(...listAssignments(c.id, true));
  }

  // Collect referenced resource ids.
  const resourceIds = new Set<string>();
  for (const a of assignments) {
    try {
      for (const rid of JSON.parse(a.resource_ids_json) as string[]) resourceIds.add(rid);
    } catch {
      /* ignore malformed */
    }
  }

  const resources: Resource[] = [];
  for (const rid of resourceIds) {
    const r = db.prepare('SELECT * FROM resources WHERE id = ?').get(rid) as Resource | undefined;
    if (r) resources.push(r);
  }

  const filteredAssignments = since
    ? assignments.filter((a) => isAfter(a.published_at ?? a.created_at, since))
    : assignments;

  return {
    classrooms,
    assignments: filteredAssignments.map(toPublicAssignment),
    resources: resources.map((r) => toPublicResource(r, true)),
    serverTime: nowIso(),
  };
}

/** Accept pushed submissions, grade them, log sync events and return feedback. */
export async function pushSubmissions(input: {
  studentId: string;
  deviceId: string;
  submissions: PushSubmissionInput[];
}): Promise<PushResponse> {
  const syncedSubmissionIds: string[] = [];
  const feedback: PushFeedback[] = [];

  for (const sub of input.submissions) {
    const { submission, feedback: itemFeedback } = await ingestSubmission({
      id: sub.id,
      assignmentId: sub.assignmentId,
      studentId: input.studentId,
      answers: sub.answers,
      submittedAt: sub.submittedAt,
    });

    syncedSubmissionIds.push(submission.id);
    feedback.push({
      submissionId: submission.id,
      score: submission.score ?? 0,
      maxScore: submission.max_score ?? 0,
      feedback: itemFeedback,
    });

    logSyncEvent({
      deviceId: input.deviceId,
      entityType: 'submission',
      entityId: submission.id,
      operation: 'push',
      payload: { assignmentId: sub.assignmentId, answers: sub.answers },
    });
  }

  return { status: 'ok', syncedSubmissionIds, feedback };
}
