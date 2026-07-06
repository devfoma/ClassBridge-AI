import { safeParse, safeStringify } from '../utils/safeJson';
import { scoreQuizLocally, answeredCount } from '../services/quizScoring';
import { canTransition, nextStatus, STATUS_LABEL } from '../services/submissionStatus';
import { Quiz } from '../types/quiz';
import { SubmissionStatus } from '../types/submission';

describe('safeJson', () => {
  it('parses valid JSON', () => {
    expect(safeParse<{ a: number }>('{"a":1}', { a: 0 }).a).toBe(1);
  });
  it('returns fallback on invalid JSON', () => {
    expect(safeParse<number[]>('not json', [])).toEqual([]);
  });
  it('returns fallback on null/empty', () => {
    expect(safeParse(null, 'x')).toBe('x');
    expect(safeParse('', 'y')).toBe('y');
  });
  it('stringifies safely', () => {
    expect(safeStringify({ a: 1 })).toBe('{"a":1}');
  });
});

describe('quiz scoring helper', () => {
  const quiz: Quiz = {
    questions: [
      { id: 'q1', type: 'multiple_choice', question: 'Gas released?', options: ['Oxygen', 'Argon', 'Neon', 'Xenon'], answer: 'Oxygen', marks: 1 },
      { id: 'q2', type: 'multiple_choice', question: '2+2?', options: ['3', '4', '5', '6'], answer: '4', marks: 2 },
      { id: 'q3', type: 'short_answer', question: 'Explain.', options: [], answer: 'A sentence.', marks: 2 },
    ],
  };

  it('scores multiple choice locally and flags short answers for the hub', () => {
    const result = scoreQuizLocally(quiz, [
      { questionId: 'q1', answer: 'Oxygen' },
      { questionId: 'q2', answer: '4' },
      { questionId: 'q3', answer: 'Some text' },
    ]);
    expect(result.score).toBe(3); // 1 + 2 from MC
    expect(result.maxScore).toBe(5);
    expect(result.autoGraded).toBe(false); // has short answer
  });

  it('gives 0 for wrong MC answers', () => {
    const result = scoreQuizLocally(quiz, [{ questionId: 'q1', answer: 'Argon' }]);
    expect(result.score).toBe(0);
  });

  it('counts answered questions', () => {
    expect(
      answeredCount([
        { questionId: 'q1', answer: 'Oxygen' },
        { questionId: 'q2', answer: '' },
        { questionId: 'q3', answer: '  ' },
      ])
    ).toBe(1);
  });
});

describe('submission status transitions', () => {
  it('allows the offline-first happy path', () => {
    const path: SubmissionStatus[] = ['draft', 'completed_unsynced', 'syncing', 'synced'];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it('allows the failure + retry path', () => {
    expect(canTransition('completed_unsynced', 'syncing')).toBe(true);
    expect(canTransition('syncing', 'sync_failed')).toBe(true);
    expect(canTransition('sync_failed', 'syncing')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('draft', 'synced')).toBe(false);
    expect(canTransition('synced', 'draft')).toBe(false);
    expect(() => nextStatus('draft', 'synced')).toThrow();
  });

  it('has a label for every status', () => {
    (['draft', 'completed_unsynced', 'syncing', 'synced', 'sync_failed'] as SubmissionStatus[]).forEach((s) => {
      expect(STATUS_LABEL[s]).toBeTruthy();
    });
  });
});
