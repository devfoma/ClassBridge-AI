import { safeJsonParse } from '../utils/safeJson';
import {
  parseAndValidate,
  summarySchema,
  quizSchema,
  normalizeQuiz,
} from '../services/jsonRepair.service';
import { mockGemma } from '../services/gemmaMock.service';
import { summarizeResourcePrompt } from '../prompts/summarizeResource.prompt';
import { generateQuizPrompt } from '../prompts/generateQuiz.prompt';
import { ResourceSummary, Quiz } from '../types/quiz';

const LESSON =
  'Photosynthesis is the process by which green plants make their own food using sunlight, water and carbon dioxide. Chlorophyll traps sunlight. Plants release oxygen. Plants are producers.';

describe('safeJson parser', () => {
  it('parses clean JSON', () => {
    const r = safeJsonParse('{"a":1}');
    expect(r.ok).toBe(true);
    expect((r.data as { a: number }).a).toBe(1);
  });

  it('repairs JSON wrapped in markdown fences', () => {
    const r = safeJsonParse('```json\n{"a":2}\n```');
    expect(r.ok).toBe(true);
    expect((r.data as { a: number }).a).toBe(2);
  });

  it('extracts the first JSON object from surrounding prose', () => {
    const r = safeJsonParse('Sure! Here is the result: {"a":3, "b":[1,2]} Hope that helps.');
    expect(r.ok).toBe(true);
    expect((r.data as { b: number[] }).b).toEqual([1, 2]);
  });

  it('fails gracefully on hopeless input without throwing', () => {
    const r = safeJsonParse('this is not json at all');
    expect(r.ok).toBe(false);
    expect(r.data).toBeNull();
  });
});

describe('mock Gemma provider', () => {
  it('returns valid summary JSON', () => {
    const raw = mockGemma(summarizeResourcePrompt(LESSON, 'Basic Science', 'JSS2'));
    const result = parseAndValidate<ResourceSummary>(raw, summarySchema);
    expect(result.ok).toBe(true);
    expect(result.data?.summary.length).toBeGreaterThan(0);
    expect(Array.isArray(result.data?.topics)).toBe(true);
  });

  it('returns valid quiz JSON with correct MC option counts', () => {
    const raw = mockGemma(generateQuizPrompt(LESSON, 5, 'JSS2'));
    const result = parseAndValidate<Quiz>(raw, quizSchema);
    expect(result.ok).toBe(true);
    const quiz = normalizeQuiz(result.data!);
    expect(quiz.questions.length).toBeGreaterThanOrEqual(1);
    for (const q of quiz.questions) {
      if (q.type === 'multiple_choice') {
        expect(q.options.length).toBe(4);
        expect(q.options).toContain(q.answer);
      } else {
        expect(q.options.length).toBe(0);
      }
    }
  });
});

describe('malformed AI JSON handling', () => {
  it('rejects malformed JSON safely (no throw, ok=false)', () => {
    const result = parseAndValidate<Quiz>('totally broken {not json', quizSchema);
    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
  });

  it('rejects JSON that does not match the schema', () => {
    const result = parseAndValidate<Quiz>('{"questions": "not an array"}', quizSchema);
    expect(result.ok).toBe(false);
  });

  it('normalizeQuiz pads multiple-choice options to 4', () => {
    const quiz = normalizeQuiz({
      questions: [
        { id: 'q1', type: 'multiple_choice', question: 'Q?', options: ['A', 'B'], answer: 'A', marks: 1 },
      ],
    });
    expect(quiz.questions[0].options.length).toBe(4);
  });
});
