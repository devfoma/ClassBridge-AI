export interface Classroom {
  id: string;
  name: string;
  class_code?: string;
  classCode?: string;
  teacher_id?: string;
  created_at?: string;
}

export interface LocalClassroom {
  id: string;
  name: string;
  classCode: string | null;
  lastSyncedAt: string | null;
}

export interface ClassroomDetail extends Classroom {
  members: Array<{ studentId: string; name: string; joinedAt: string }>;
  assignmentsCount: number;
  pendingSubmissionsCount: number;
}
