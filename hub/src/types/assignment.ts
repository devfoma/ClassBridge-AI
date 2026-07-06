import { Quiz } from './quiz';

export interface Assignment {
  id: string;
  classroom_id: string;
  title: string;
  instructions: string | null;
  resource_ids_json: string;
  quiz_json: string;
  published_at: string | null;
  created_at: string;
}

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
