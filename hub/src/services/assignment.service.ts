import { getDb } from '../db';
import { newId } from '../utils/ids';
import { nowIso } from '../utils/dates';
import { badRequest, notFound } from '../utils/errors';
import { Assignment, AssignmentPublic } from '../types/assignment';
import { Quiz } from '../types/quiz';
import { normalizeQuiz } from './jsonRepair.service';

export function createAssignment(input: {
  classroomId: string;
  title: string;
  instructions?: string;
  resourceIds: string[];
  quiz: Quiz;
  publish?: boolean;
}): Assignment {
  const db = getDb();
  if (!input.title?.trim()) throw badRequest('Assignment title is required');
  if (!input.quiz || !Array.isArray(input.quiz.questions) || input.quiz.questions.length === 0) {
    throw badRequest('Assignment must include at least one quiz question');
  }

  const classroom = db.prepare('SELECT 1 FROM classrooms WHERE id = ?').get(input.classroomId);
  if (!classroom) throw notFound('Classroom not found');

  const quiz = normalizeQuiz(input.quiz);
  const now = nowIso();
  const assignment: Assignment = {
    id: newId('asg'),
    classroom_id: input.classroomId,
    title: input.title.trim(),
    instructions: input.instructions ?? null,
    resource_ids_json: JSON.stringify(input.resourceIds ?? []),
    quiz_json: JSON.stringify(quiz),
    published_at: input.publish ? now : null,
    created_at: now,
  };

  db.prepare(
    `INSERT INTO assignments
     (id, classroom_id, title, instructions, resource_ids_json, quiz_json, published_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    assignment.id,
    assignment.classroom_id,
    assignment.title,
    assignment.instructions,
    assignment.resource_ids_json,
    assignment.quiz_json,
    assignment.published_at,
    assignment.created_at
  );

  return assignment;
}

export function publishAssignment(id: string): Assignment {
  const db = getDb();
  const assignment = getAssignment(id);
  if (!assignment) throw notFound('Assignment not found');
  if (!assignment.published_at) {
    db.prepare('UPDATE assignments SET published_at = ? WHERE id = ?').run(nowIso(), id);
  }
  return getAssignment(id)!;
}

export function getAssignment(id: string): Assignment | undefined {
  return getDb().prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Assignment | undefined;
}

export function getAssignmentOrThrow(id: string): Assignment {
  const a = getAssignment(id);
  if (!a) throw notFound(`Assignment "${id}" not found`);
  return a;
}

export function listAssignments(classroomId: string, onlyPublished = true): Assignment[] {
  const db = getDb();
  const sql = onlyPublished
    ? 'SELECT * FROM assignments WHERE classroom_id = ? AND published_at IS NOT NULL ORDER BY created_at DESC'
    : 'SELECT * FROM assignments WHERE classroom_id = ? ORDER BY created_at DESC';
  return db.prepare(sql).all(classroomId) as Assignment[];
}

export function toPublicAssignment(a: Assignment): AssignmentPublic {
  return {
    id: a.id,
    classroomId: a.classroom_id,
    title: a.title,
    instructions: a.instructions,
    resourceIds: safeArray(a.resource_ids_json),
    quiz: JSON.parse(a.quiz_json) as Quiz,
    publishedAt: a.published_at,
    createdAt: a.created_at,
  };
}

export function getAssignmentQuiz(a: Assignment): Quiz {
  return JSON.parse(a.quiz_json) as Quiz;
}

function safeArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
