import { getDb } from '../db';
import { newId } from '../utils/ids';
import { nowIso } from '../utils/dates';
import { notFound } from '../utils/errors';
import { Submission, SubmissionAnswer, SubmissionFeedbackItem, SubmissionPublic } from '../types/submission';
import { getAssignmentOrThrow, getAssignmentQuiz } from './assignment.service';
import { gradeSubmission } from './grading.service';

/**
 * Ingest a pushed submission from a student device: grade it and store the
 * score + feedback. If a submission with the same id already exists we update
 * it (idempotent sync). Student devices own answers; the hub owns grades.
 */
export async function ingestSubmission(input: {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: SubmissionAnswer[];
  submittedAt?: string;
}): Promise<{ submission: Submission; feedback: SubmissionFeedbackItem[] }> {
  const db = getDb();
  const assignment = getAssignmentOrThrow(input.assignmentId);
  const quiz = getAssignmentQuiz(assignment);

  const graded = await gradeSubmission(quiz, input.answers);
  const now = nowIso();

  const existing = db.prepare('SELECT * FROM submissions WHERE id = ?').get(input.id) as
    | Submission
    | undefined;

  const submission: Submission = {
    id: input.id || newId('sub'),
    assignment_id: input.assignmentId,
    student_id: input.studentId,
    answers_json: JSON.stringify(input.answers),
    score: graded.score,
    max_score: graded.maxScore,
    feedback_json: JSON.stringify(graded.feedback),
    submitted_at: input.submittedAt ?? now,
    synced_at: now,
    created_at: existing?.created_at ?? now,
  };

  if (existing) {
    db.prepare(
      `UPDATE submissions SET answers_json = ?, score = ?, max_score = ?, feedback_json = ?,
       submitted_at = ?, synced_at = ? WHERE id = ?`
    ).run(
      submission.answers_json,
      submission.score,
      submission.max_score,
      submission.feedback_json,
      submission.submitted_at,
      submission.synced_at,
      submission.id
    );
  } else {
    db.prepare(
      `INSERT INTO submissions
       (id, assignment_id, student_id, answers_json, score, max_score, feedback_json, submitted_at, synced_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      submission.id,
      submission.assignment_id,
      submission.student_id,
      submission.answers_json,
      submission.score,
      submission.max_score,
      submission.feedback_json,
      submission.submitted_at,
      submission.synced_at,
      submission.created_at
    );
  }

  return { submission, feedback: graded.feedback };
}

export function getSubmission(id: string): Submission | undefined {
  return getDb().prepare('SELECT * FROM submissions WHERE id = ?').get(id) as Submission | undefined;
}

export function listSubmissionsByAssignment(assignmentId: string): SubmissionPublic[] {
  const rows = getDb()
    .prepare('SELECT * FROM submissions WHERE assignment_id = ? ORDER BY synced_at DESC')
    .all(assignmentId) as Submission[];
  return rows.map(toPublicSubmission);
}

export function listSubmissionsByClassroom(classroomId: string): SubmissionPublic[] {
  const rows = getDb()
    .prepare(
      `SELECT s.* FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE a.classroom_id = ?
       ORDER BY s.synced_at DESC`
    )
    .all(classroomId) as Submission[];
  return rows.map(toPublicSubmission);
}

export function toPublicSubmission(s: Submission): SubmissionPublic {
  const db = getDb();
  const student = db.prepare('SELECT name FROM users WHERE id = ?').get(s.student_id) as
    | { name: string }
    | undefined;
  const assignment = db.prepare('SELECT title FROM assignments WHERE id = ?').get(s.assignment_id) as
    | { title: string }
    | undefined;

  return {
    id: s.id,
    assignmentId: s.assignment_id,
    assignmentTitle: assignment?.title ?? 'Assignment',
    studentId: s.student_id,
    studentName: student?.name ?? 'Student',
    answers: parse<SubmissionAnswer[]>(s.answers_json, []),
    score: s.score,
    maxScore: s.max_score,
    feedback: parse<SubmissionFeedbackItem[]>(s.feedback_json, []),
    submittedAt: s.submitted_at,
    syncedAt: s.synced_at,
  };
}

function parse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
