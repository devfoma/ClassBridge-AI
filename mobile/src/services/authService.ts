import { LocalUser, UserRole } from '../types/user';
import { getLocalUser, saveLocalUser, updateHubUrl, updateName } from '../db/repositories/localUserRepo';
import { newId, newDeviceId } from '../utils/ids';
import { api } from './apiClient';

/**
 * Create or update the local profile. The device id is stable across role
 * changes so the same device keeps its identity. No passwords: a class code +
 * device id is all the MVP needs.
 */
export async function chooseRole(role: UserRole, name?: string): Promise<LocalUser> {
  const existing = await getLocalUser();
  const deviceId = existing?.deviceId ?? newDeviceId();
  const user: LocalUser = {
    id: existing?.id ?? newId(role === 'teacher' ? 'teacher' : 'student'),
    name: name?.trim() || existing?.name || (role === 'teacher' ? 'Teacher' : 'Student'),
    role,
    deviceId,
    hubUrl: existing?.hubUrl ?? null,
  };
  await saveLocalUser(user);
  return user;
}

export async function setName(name: string): Promise<void> {
  await updateName(name.trim());
}

export async function setHubUrl(hubUrl: string): Promise<void> {
  await updateHubUrl(hubUrl.trim());
}

export async function currentUser(): Promise<LocalUser | null> {
  return getLocalUser();
}

/** Push the local profile to the hub so the teacher/student exists server-side. */
export async function registerWithHub(user: LocalUser): Promise<void> {
  if (!user.hubUrl) return;
  await api.upsertUser(user.hubUrl, {
    id: user.id,
    name: user.name,
    role: user.role,
    deviceId: user.deviceId,
  });
}
