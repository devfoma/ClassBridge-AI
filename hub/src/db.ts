import fs from 'fs';
import path from 'path';
import { config } from './config';
import { SCHEMA_SQL } from './schema';
import { SqliteDatabase } from './sqlite';

let db: SqliteDatabase | null = null;

/**
 * Returns the singleton DB connection, initialising the schema on first use.
 * Under NODE_ENV=test we use an in-memory database so tests are isolated and fast.
 */
export function getDb(): SqliteDatabase {
  if (db) return db;

  if (config.isTest) {
    db = new SqliteDatabase(':memory:');
  } else {
    const dir = path.dirname(config.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new SqliteDatabase(config.dbPath);
    db.pragma('journal_mode = WAL');
  }

  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);

  // Schema migrations for updated user fields
  try { db.prepare('ALTER TABLE users ADD COLUMN email TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run(); } catch {}

  return db;
}

/** Close and reset the connection (used by tests and the reset script). */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/** Drop all rows (keeps schema). Used by the reset script and tests. */
export function clearAllTables(): void {
  const d = getDb();
  const tables = ['sync_events', 'submissions', 'assignments', 'resources', 'classroom_members', 'classrooms', 'users'];
  const tx = d.transaction(() => {
    for (const t of tables) d.prepare(`DELETE FROM ${t}`).run();
  });
  tx();
}
