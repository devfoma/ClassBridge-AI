import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrations';

const DB_NAME = 'classbridge.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

/** Open (once) and migrate the on-device database. Safe to call repeatedly. */
export function getMobileDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
}

/** Wipe all local demo data (used by the Settings "Clear local data" action). */
export async function clearLocalData(): Promise<void> {
  const db = await getMobileDb();
  await db.execAsync(`
    DELETE FROM local_submissions;
    DELETE FROM local_assignments;
    DELETE FROM local_resources;
    DELETE FROM local_classrooms;
    DELETE FROM local_meta WHERE key = 'last_sync_time';
  `);
}

/** Reset everything including the user profile (full factory reset). */
export async function resetEverything(): Promise<void> {
  const db = await getMobileDb();
  await db.execAsync(`
    DELETE FROM local_submissions;
    DELETE FROM local_assignments;
    DELETE FROM local_resources;
    DELETE FROM local_classrooms;
    DELETE FROM local_user;
    DELETE FROM local_meta;
  `);
}
