import { getMobileDb } from '../mobileDb';
import { LocalSubmission, SubmissionStatus, SubmissionFeedbackItem } from '../../types/submission';
import { QuizAnswer } from '../../types/quiz';
import { safeParse } from '../../utils/safeJson';

interface SubmissionRow {
  id: string;
  assignment_id: string;
  student_id: string;
  answers_json: string;
  status: string;
  score: number | null;
  max_score: number | null;
  feedback_json: string | null;
  created_at: string;
  synced_at: string | null;
}

function toSubmission(r: SubmissionRow): LocalSubmission {
  return {
    id: r.id,
    assignmentId: r.assignment_id,
    studentId: r.student_id,
    answers: safeParse<QuizAnswer[]>(r.answers_json, []),
    status: r.status as SubmissionStatus,
    score: r.score,
    maxScore: r.max_score,
    feedback: r.feedback_json ? safeParse<SubmissionFeedbackItem[]>(r.feedback_json, []) : null,
    createdAt: r.created_at,
    syncedAt: r.synced_at,
  };
}

export async function upsertSubmission(s: LocalSubmission): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync(
    `INSERT INTO local_submissions
       (id, assignment_id, student_id, answers_json, status, score, max_score, feedback_json, created_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET answers_json = excluded.answers_json, status = excluded.status,
       score = excluded.score, max_score = excluded.max_score, feedback_json = excluded.feedback_json,
       synced_at = excluded.synced_at`,
    s.id,
    s.assignmentId,
    s.studentId,
    JSON.stringify(s.answers),
    s.status,
    s.score,
    s.maxScore,
    s.feedback ? JSON.stringify(s.feedback) : null,
    s.createdAt,
    s.syncedAt
  );
}

export async function setStatus(ids: string[], status: SubmissionStatus): Promise<void> {
  if (ids.length === 0) return;
  const db = await getMobileDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE local_submissions SET status = ? WHERE id IN (${placeholders})`,
    status,
    ...ids
  );
}

export async function applyFeedback(
  id: string,
  score: number,
  maxScore: number,
  feedback: SubmissionFeedbackItem[],
  syncedAt: string
): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync(
    `UPDATE local_submissions SET status = 'synced', score = ?, max_score = ?, feedback_json = ?, synced_at = ?
     WHERE id = ?`,
    score,
    maxScore,
    JSON.stringify(feedback),
    syncedAt,
    id
  );
}

export async function getPending(): Promise<LocalSubmission[]> {
  const db = await getMobileDb();
  const rows = await db.getAllAsync<SubmissionRow>(
    "SELECT * FROM local_submissions WHERE status IN ('completed_unsynced','sync_failed') ORDER BY created_at ASC"
  );
  return rows.map(toSubmission);
}

export async function getByAssignment(assignmentId: string): Promise<LocalSubmission | null> {
  const db = await getMobileDb();
  const row = await db.getFirstAsync<SubmissionRow>(
    'SELECT * FROM local_submissions WHERE assignment_id = ? ORDER BY created_at DESC LIMIT 1',
    assignmentId
  );
  return row ? toSubmission(row) : null;
}

export async function listSubmissions(): Promise<LocalSubmission[]> {
  const db = await getMobileDb();
  const rows = await db.getAllAsync<SubmissionRow>('SELECT * FROM local_submissions ORDER BY created_at DESC');
  return rows.map(toSubmission);
}

export async function listSynced(): Promise<LocalSubmission[]> {
  const db = await getMobileDb();
  const rows = await db.getAllAsync<SubmissionRow>(
    "SELECT * FROM local_submissions WHERE status = 'synced' ORDER BY synced_at DESC"
  );
  return rows.map(toSubmission);
}

export async function countByStatus(status: SubmissionStatus | SubmissionStatus[]): Promise<number> {
  const db = await getMobileDb();
  const statuses = Array.isArray(status) ? status : [status];
  const placeholders = statuses.map(() => '?').join(',');
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM local_submissions WHERE status IN (${placeholders})`,
    ...statuses
  );
  return row?.c ?? 0;
}
