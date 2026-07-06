import { askGemma } from './gemma.service';
import { gradeAnswerPrompt } from '../prompts/gradeAnswer.prompt';
import { parseAndValidate, gradeSchema, ensureGrade } from './jsonRepair.service';
import { GradeResult, Quiz, QuizQuestion } from '../types/quiz';
import { SubmissionAnswer, SubmissionFeedbackItem } from '../types/submission';

/**
 * Grade a single answer. Multiple-choice questions are graded locally and
 * deterministically (no AI needed). Short-answer questions go to Gemma; if the
 * AI output is malformed we fall back to a simple keyword-overlap score so the
 * app never crashes on bad JSON (rule 20).
 */
export async function gradeAnswer(input: {
  question: string;
  expectedAnswer: string;
  studentAnswer: string;
  maxScore: number;
  type?: 'multiple_choice' | 'short_answer';
}): Promise<GradeResult> {
  const { question, expectedAnswer, studentAnswer, maxScore } = input;

  if (input.type === 'multiple_choice') {
    const correct =
      normalize(studentAnswer) === normalize(expectedAnswer) && studentAnswer.trim().length > 0;
    return {
      score: correct ? maxScore : 0,
      maxScore,
      feedback: correct ? 'Correct.' : `Not quite. The correct answer is "${expectedAnswer}".`,
      misconception: correct ? '' : 'Selected the wrong option.',
    };
  }

  const prompt = gradeAnswerPrompt(question, expectedAnswer, studentAnswer, maxScore);
  const { raw } = await askGemma(prompt);
  const result = parseAndValidate<GradeResult>(raw, gradeSchema);

  if (!result.ok || !result.data) {
    return keywordFallback(expectedAnswer, studentAnswer, maxScore);
  }
  return ensureGrade(result.data, maxScore);
}

/** Grade a whole submission against an assignment's quiz. */
export async function gradeSubmission(
  quiz: Quiz,
  answers: SubmissionAnswer[]
): Promise<{ score: number; maxScore: number; feedback: SubmissionFeedbackItem[] }> {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
  const feedback: SubmissionFeedbackItem[] = [];
  let score = 0;
  let maxScore = 0;

  for (const q of quiz.questions) {
    const studentAnswer = answerMap.get(q.id) ?? '';
    const graded = await gradeAnswer({
      question: q.question,
      expectedAnswer: q.answer,
      studentAnswer,
      maxScore: q.marks,
      type: q.type,
    });
    score += graded.score;
    maxScore += q.marks;
    feedback.push({
      questionId: q.id,
      score: graded.score,
      maxScore: q.marks,
      feedback: graded.feedback,
      misconception: graded.misconception,
    });
  }

  return { score: Math.round(score * 10) / 10, maxScore, feedback };
}

function keywordFallback(expected: string, student: string, maxScore: number): GradeResult {
  const e = new Set((expected.toLowerCase().match(/[a-z]{3,}/g) || []));
  const s = new Set(student.toLowerCase().match(/[a-z]{3,}/g) || []);
  if (student.trim().length === 0) {
    return { score: 0, maxScore, feedback: 'No answer provided.', misconception: 'Left blank.' };
  }
  let hit = 0;
  for (const w of e) if (s.has(w)) hit++;
  const ratio = e.size ? hit / e.size : 0.5;
  const score = Math.round(ratio * maxScore * 10) / 10;
  return {
    score: Math.max(0, Math.min(score, maxScore)),
    maxScore,
    feedback:
      ratio >= 0.5
        ? 'Good, your answer covers the main points.'
        : 'Partly correct. Review the lesson and add the key terms.',
    misconception: ratio >= 0.5 ? '' : 'Answer is missing key terms from the lesson.',
  };
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}
