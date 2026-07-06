import { getMobileDb } from '../mobileDb';

const LAST_SYNC_KEY = 'last_sync_time';

export async function getLastSyncTime(): Promise<string | null> {
  const db = await getMobileDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM local_meta WHERE key = ?',
    LAST_SYNC_KEY
  );
  return row?.value ?? null;
}

export async function setLastSyncTime(iso: string): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO local_meta (key, value) VALUES (?, ?)',
    LAST_SYNC_KEY,
    iso
  );
}
