import { z } from 'zod';
import { safeJsonParse } from '../utils/safeJson';
import { Quiz, QuizQuestion, ResourceSummary, GradeResult } from '../types/quiz';
import { newId } from '../utils/ids';

/**
 * Zod schemas describing the JSON shapes we expect back from Gemma.
 * These guard the app against malformed AI output (rule 19/20).
 */

export const summarySchema = z.object({
  title: z.string().default('Untitled Resource'),
  subject: z.string().default('General'),
  level: z.string().default('JSS2'),
  topics: z.array(z.string()).default([]),
  summary: z.string().default(''),
  prerequisites: z.array(z.string()).default([]),
  suggestedActivity: z.string().default(''),
});

const quizQuestionSchema = z.object({
  id: z.string().default(''),
  type: z.enum(['multiple_choice', 'short_answer']),
  question: z.string(),
  options: z.array(z.string()).default([]),
  answer: z.string().default(''),
  marks: z.number().default(1),
});

export const quizSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1),
});

export const gradeSchema = z.object({
  score: z.number(),
  maxScore: z.number(),
  feedback: z.string().default(''),
  misconception: z.string().default(''),
});

export const insightSchema = z.object({
  summary: z.string().default(''),
  commonMisconceptions: z.array(z.string()).default([]),
  recommendedRevision: z.string().default(''),
  nextActivity: z.string().default(''),
});

export interface RepairResult<T> {
  ok: boolean;
  data: T | null;
  error?: string;
}

/** Parse (with repair) then validate against a zod schema. Never throws. */
export function parseAndValidate<T>(
  raw: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<T, z.ZodTypeDef, any>
): RepairResult<T> {
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) {
    return { ok: false, data: null, error: parsed.error };
  }
  const result = schema.safeParse(parsed.data);
  if (!result.success) {
    return { ok: false, data: null, error: result.error.message };
  }
  return { ok: true, data: result.data };
}

/** Normalise a validated quiz: enforce ids, MC option counts and marks. */
export function normalizeQuiz(quiz: Quiz): Quiz {
  const questions: QuizQuestion[] = quiz.questions.map((q, i) => {
    const id = q.id && q.id.trim() ? q.id : `q${i + 1}`;
    const marks = typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1;
    if (q.type === 'multiple_choice') {
      let options = Array.isArray(q.options) ? q.options.filter((o) => o && o.trim()) : [];
      // pad or trim to 4 options for demo reliability
      while (options.length < 4) options.push(`Option ${options.length + 1}`);
      if (options.length > 4) options = options.slice(0, 4);
      let answer = q.answer;
      if (!options.includes(answer)) answer = options[0];
      return { id, type: 'multiple_choice', question: q.question, options, answer, marks };
    }
    return { id, type: 'short_answer', question: q.question, options: [], answer: q.answer, marks };
  });
  return { questions };
}

export function ensureSummary(data: ResourceSummary): ResourceSummary {
  return data;
}

export function ensureGrade(data: GradeResult, maxScore: number): GradeResult {
  const clamped = Math.max(0, Math.min(data.score, maxScore));
  return { ...data, score: clamped, maxScore };
}

/** Produce a stable id for a generated question when the model omits one. */
export function fallbackQuestionId(): string {
  return newId('q');
}
