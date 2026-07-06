import { Quiz } from '../types/quiz';
import { QuizAnswer } from '../types/quiz';

export interface LocalScore {
  score: number;
  maxScore: number;
  autoGraded: boolean; // true if every question could be graded on-device
}

/**
 * Optional on-device provisional scoring. Multiple-choice questions can be
 * graded locally (offline). Short-answer questions need the hub's Gemma pass,
 * so they are counted toward maxScore but score 0 until synced. This gives the
 * student instant feedback offline while the hub remains the authority.
 */
export function scoreQuizLocally(quiz: Quiz, answers: QuizAnswer[]): LocalScore {
  const map = new Map(answers.map((a) => [a.questionId, a.answer]));
  let score = 0;
  let maxScore = 0;
  let allAuto = true;

  for (const q of quiz.questions) {
    maxScore += q.marks;
    const given = (map.get(q.id) ?? '').trim();
    if (q.type === 'multiple_choice') {
      if (given && given.toLowerCase() === q.answer.trim().toLowerCase()) {
        score += q.marks;
      }
    } else {
      allAuto = false; // short answer graded by hub
    }
  }

  return { score: Math.round(score * 10) / 10, maxScore, autoGraded: allAuto };
}

/** How many questions have a non-empty answer. */
export function answeredCount(answers: QuizAnswer[]): number {
  return answers.filter((a) => a.answer && a.answer.trim().length > 0).length;
}
