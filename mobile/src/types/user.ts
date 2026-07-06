export type UserRole = 'teacher' | 'student';

export interface LocalUser {
  id: string;
  name: string;
  role: UserRole;
  deviceId: string;
  hubUrl: string | null;
}
