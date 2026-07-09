import { getMobileDb } from '../mobileDb';
import { LocalUser, UserRole } from '../../types/user';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  device_id: string;
  hub_url: string | null;
}

interface AccountRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  device_id: string;
  hub_url: string | null;
}

function toUser(row: UserRow): LocalUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    deviceId: row.device_id,
    hubUrl: row.hub_url,
  };
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const db = await getMobileDb();
  // Ensure table exists with email since schema might not have updated correctly on active device
  try { await db.runAsync('ALTER TABLE local_user ADD COLUMN email TEXT'); } catch {}
  
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM local_user LIMIT 1');
  return row ? toUser(row) : null;
}

export async function saveLocalUser(user: LocalUser): Promise<void> {
  const db = await getMobileDb();
  try { await db.runAsync('ALTER TABLE local_user ADD COLUMN email TEXT'); } catch {}
  
  // Single-profile device active session
  await db.runAsync('DELETE FROM local_user');
  await db.runAsync(
    'INSERT INTO local_user (id, email, name, role, device_id, hub_url) VALUES (?, ?, ?, ?, ?, ?)',
    user.id,
    user.email,
    user.name,
    user.role,
    user.deviceId,
    user.hubUrl
  );
}

export async function clearLocalUser(): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('DELETE FROM local_user');
}

export async function updateHubUrl(hubUrl: string): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('UPDATE local_user SET hub_url = ?', hubUrl);
}

export async function updateName(name: string): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('UPDATE local_user SET name = ?', name);
}

// -- Accounts --

export async function createAccount(
  id: string,
  email: string,
  passwordHash: string,
  name: string,
  role: string,
  deviceId: string
): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync(
    'INSERT INTO local_accounts (id, email, password_hash, name, role, device_id) VALUES (?, ?, ?, ?, ?, ?)',
    id, email.toLowerCase(), passwordHash, name, role, deviceId
  );
}

export async function getAccountByEmail(email: string): Promise<AccountRow | null> {
  const db = await getMobileDb();
  return db.getFirstAsync<AccountRow>('SELECT * FROM local_accounts WHERE email = ?', email.toLowerCase());
}

export async function updateAccountHubUrl(email: string, hubUrl: string): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('UPDATE local_accounts SET hub_url = ? WHERE email = ?', hubUrl, email.toLowerCase());
}
