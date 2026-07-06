import { getMobileDb } from '../mobileDb';
import { LocalUser, UserRole } from '../../types/user';

interface UserRow {
  id: string;
  name: string;
  role: string;
  device_id: string;
  hub_url: string | null;
}

function toUser(row: UserRow): LocalUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role as UserRole,
    deviceId: row.device_id,
    hubUrl: row.hub_url,
  };
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const db = await getMobileDb();
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM local_user LIMIT 1');
  return row ? toUser(row) : null;
}

export async function saveLocalUser(user: LocalUser): Promise<void> {
  const db = await getMobileDb();
  // Single-profile device: replace any existing row.
  await db.runAsync('DELETE FROM local_user');
  await db.runAsync(
    'INSERT INTO local_user (id, name, role, device_id, hub_url) VALUES (?, ?, ?, ?, ?)',
    user.id,
    user.name,
    user.role,
    user.deviceId,
    user.hubUrl
  );
}

export async function updateHubUrl(hubUrl: string): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('UPDATE local_user SET hub_url = ?', hubUrl);
}

export async function updateName(name: string): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('UPDATE local_user SET name = ?', name);
}
