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

export interface QuizAnswer {
  questionId: string;
  answer: string;
}
