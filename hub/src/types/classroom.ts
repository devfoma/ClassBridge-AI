export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  email: string | null;
  password_hash: string | null;
  name: string;
  role: UserRole;
  device_id: string | null;
  created_at: string;
}

export interface Classroom {
  id: string;
  name: string;
  teacher_id: string;
  class_code: string;
  created_at: string;
}

export interface ClassroomMember {
  id: string;
  classroom_id: string;
  student_id: string;
  joined_at: string;
}

export interface ClassroomDetail extends Classroom {
  members: Array<{ studentId: string; name: string; joinedAt: string }>;
  assignmentsCount: number;
  pendingSubmissionsCount: number;
}
