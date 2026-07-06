import { QuizAnswer } from './quiz';

export type SubmissionStatus =
  | 'draft'
  | 'completed_unsynced'
  | 'syncing'
  | 'synced'
  | 'sync_failed';

export interface SubmissionFeedbackItem {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
  misconception: string;
}

export interface LocalSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: QuizAnswer[];
  status: SubmissionStatus;
  score: number | null;
  maxScore: number | null;
  feedback: SubmissionFeedbackItem[] | null;
  createdAt: string;
  syncedAt: string | null;
}
