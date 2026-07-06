import { Classroom } from './classroom';
import { AssignmentPublic } from './assignment';
import { ResourcePublic } from './resource';
import { QuizAnswer } from './quiz';
import { SubmissionFeedbackItem } from './submission';

export interface PullResponse {
  classrooms: Classroom[];
  assignments: AssignmentPublic[];
  resources: ResourcePublic[];
  serverTime: string;
}

export interface PushSubmissionInput {
  id: string;
  assignmentId: string;
  answers: QuizAnswer[];
  submittedAt?: string;
}

export interface PushFeedback {
  submissionId: string;
  score: number;
  maxScore: number;
  feedback: SubmissionFeedbackItem[];
}

export interface PushResponse {
  status: 'ok';
  syncedSubmissionIds: string[];
  feedback: PushFeedback[];
}
