import type { SQLiteDatabase } from 'expo-sqlite';
import { MOBILE_SCHEMA_SQL } from './schema';

const CURRENT_VERSION = 1;

/**
 * Very small migration runner. For the MVP the schema is created idempotently
 * with CREATE TABLE IF NOT EXISTS, and we record a version in local_meta so we
 * can evolve later without wiping student data.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(MOBILE_SCHEMA_SQL);

  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM local_meta WHERE key = ?',
    'schema_version'
  );
  const version = row ? parseInt(row.value, 10) : 0;

  if (version < CURRENT_VERSION) {
    await db.runAsync(
      'INSERT OR REPLACE INTO local_meta (key, value) VALUES (?, ?)',
      'schema_version',
      String(CURRENT_VERSION)
    );
  }
}
