export type QuizQuestionType = 'multiple_choice' | 'short_answer';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options: string[];
  answer: string;
  marks: number;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface ResourceSummary {
  title: string;
  subject: string;
  level: string;
  topics: string[];
  summary: string;
  prerequisites: string[];
  suggestedActivity: string;
}

export interface GradeResult {
  score: number;
  maxScore: number;
  feedback: string;
  misconception: string;
}
