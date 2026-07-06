import { Quiz } from './quiz';

export interface AssignmentPublic {
  id: string;
  classroomId: string;
  title: string;
  instructions: string | null;
  resourceIds: string[];
  quiz: Quiz;
  publishedAt: string | null;
  createdAt: string;
}

export interface LocalAssignment {
  id: string;
  classroomId: string;
  title: string;
  instructions: string | null;
  quiz: Quiz;
  resourceIds: string[];
  downloadedAt: string | null;
}
