import { LocalUser, UserRole } from '../types/user';
import { getLocalUser, saveLocalUser, updateHubUrl, updateName, clearLocalUser, createAccount, getAccountByEmail } from '../db/repositories/localUserRepo';
import { newId, newDeviceId } from '../utils/ids';
import { api } from './apiClient';
import { sha256 } from '../utils/crypto';

async function hashPassword(password: string): Promise<string> {
  return sha256(password);
}

export async function register(email: string, password: string, role: UserRole, name: string, hubUrl?: string): Promise<LocalUser> {
  const existing = await getAccountByEmail(email);
  if (existing) throw new Error('Account with this email already exists.');

  const passwordHash = await hashPassword(password);
  const id = newId(role === 'teacher' ? 'teacher' : 'student');
  const deviceId = newDeviceId();
  
  await createAccount(id, email, passwordHash, name.trim(), role, deviceId);
  
  const user: LocalUser = {
    id,
    email: email.toLowerCase(),
    name: name.trim() || (role === 'teacher' ? 'Teacher' : 'Student'),
    role,
    deviceId,
    hubUrl: hubUrl || null,
  };
  
  await saveLocalUser(user);
  if (hubUrl) {
    try { await registerWithHub(user, passwordHash); } catch (err) { console.warn('Failed to sync registration to hub', err); }
  }
  return user;
}

export async function login(email: string, password: string, hubUrl?: string): Promise<LocalUser> {
  const passwordHash = await hashPassword(password);
  let account = await getAccountByEmail(email);

  // If no local account but a hub URL is provided, try pulling from the hub
  if (!account && hubUrl) {
    try {
      const res = await api.login(hubUrl, email, passwordHash);
      if (res.user) {
        // Create local account cache from hub profile
        await createAccount(res.user.id, email, passwordHash, res.user.name, res.user.role, res.user.device_id || newDeviceId());
        account = await getAccountByEmail(email);
      }
    } catch (err) {
      throw new Error('Invalid email, password, or could not reach hub.');
    }
  }

  if (!account) throw new Error('Invalid email or password.');

  if (account.password_hash !== passwordHash) {
    throw new Error('Invalid email or password.');
  }

  const user: LocalUser = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role as UserRole,
    deviceId: account.device_id,
    hubUrl: hubUrl || account.hub_url,
  };

  await saveLocalUser(user);
  return user;
}

export async function logout(): Promise<void> {
  await clearLocalUser();
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
export async function registerWithHub(user: LocalUser, passwordHash?: string): Promise<void> {
  if (!user.hubUrl) return;
  // If we don't have the hash in memory, look it up
  if (!passwordHash && user.email) {
    const acc = await getAccountByEmail(user.email);
    if (acc) passwordHash = acc.password_hash;
  }
  await api.upsertUser(user.hubUrl, {
    id: user.id,
    email: user.email,
    passwordHash: passwordHash || null,
    name: user.name,
    role: user.role,
    deviceId: user.deviceId,
  });
}
