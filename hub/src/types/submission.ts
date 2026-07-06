export interface SubmissionAnswer {
  questionId: string;
  answer: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  answers_json: string;
  score: number | null;
  max_score: number | null;
  feedback_json: string | null;
  submitted_at: string | null;
  synced_at: string | null;
  created_at: string;
}

export interface SubmissionFeedbackItem {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
  misconception: string;
}

export interface SubmissionPublic {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  answers: SubmissionAnswer[];
  score: number | null;
  maxScore: number | null;
  feedback: SubmissionFeedbackItem[];
  submittedAt: string | null;
  syncedAt: string | null;
}
