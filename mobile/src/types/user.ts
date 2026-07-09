export type UserRole = 'teacher' | 'student';

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  deviceId: string;
  hubUrl: string | null;
}
