import { safeJsonParse } from '../utils/safeJson';
import {
  parseAndValidate,
  askGemmaForJson,
  summarySchema,
  quizSchema,
  normalizeQuiz,
} from '../services/jsonRepair.service';
import { mockGemma } from '../services/gemmaMock.service';
import * as gemmaService from '../services/gemma.service';
import { summarizeResourcePrompt } from '../prompts/summarizeResource.prompt';
import { generateQuizPrompt } from '../prompts/generateQuiz.prompt';
import { ResourceSummary, Quiz } from '../types/quiz';
import { GemmaUnavailableError } from '../types/gemma';

jest.mock('../services/gemma.service');
const mockedAskGemma = gemmaService.askGemma as jest.MockedFunction<typeof gemmaService.askGemma>;

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

describe('askGemmaForJson retry-on-malformed-draw', () => {
  beforeEach(() => {
    mockedAskGemma.mockReset();
  });

  const validQuizRaw = JSON.stringify({
    questions: [{ id: 'q1', type: 'short_answer', question: 'Q?', options: [], answer: 'A', marks: 1 }],
  });

  it('retries once after a malformed draw and succeeds on the corrected reply', async () => {
    mockedAskGemma
      .mockResolvedValueOnce({ raw: 'not json at all', provider: 'ollama', usedMockFallback: false })
      .mockResolvedValueOnce({ raw: validQuizRaw, provider: 'ollama', usedMockFallback: false });

    const result = await askGemmaForJson<Quiz>('prompt', quizSchema, 1);

    expect(result.ok).toBe(true);
    expect(result.data?.questions.length).toBe(1);
    expect(mockedAskGemma).toHaveBeenCalledTimes(2);
    // The retry prompt should reference the previous failure so the model can self-correct.
    expect(mockedAskGemma.mock.calls[1][0]).toContain('previous reply could not be parsed');
  });

  it('gives up after exhausting retries and reports ok:false', async () => {
    mockedAskGemma.mockResolvedValue({ raw: 'still not json', provider: 'ollama', usedMockFallback: false });

    const result = await askGemmaForJson<Quiz>('prompt', quizSchema, 1);

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(mockedAskGemma).toHaveBeenCalledTimes(2); // 1 initial attempt + 1 retry
  });

  it('propagates a Gemma-unavailable error immediately instead of retrying', async () => {
    mockedAskGemma.mockRejectedValueOnce(new GemmaUnavailableError('Ollama down'));

    await expect(askGemmaForJson<Quiz>('prompt', quizSchema, 1)).rejects.toThrow('Ollama down');
    expect(mockedAskGemma).toHaveBeenCalledTimes(1);
  });
});
