import { SubmissionAnswer, SubmissionFeedbackItem } from './submission';
import { AssignmentPublic } from './assignment';
import { ResourcePublic } from './resource';
import { Classroom } from './classroom';

export interface SyncEvent {
  id: string;
  device_id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  payload_json: string;
  created_at: string;
}

export interface PullResponse {
  classrooms: Classroom[];
  assignments: AssignmentPublic[];
  resources: ResourcePublic[];
  serverTime: string;
}

export interface PushSubmissionInput {
  id: string;
  assignmentId: string;
  answers: SubmissionAnswer[];
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
