/**
 * On-device SQLite schema. The student device owns local drafts, offline quiz
 * answers and unsynced submissions. The hub remains the source of truth for
 * everything else; these tables are the local cache/queue.
 */
export const MOBILE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS local_accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  device_id TEXT NOT NULL,
  hub_url TEXT
);

CREATE TABLE IF NOT EXISTS local_user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  device_id TEXT NOT NULL,
  hub_url TEXT
);

CREATE TABLE IF NOT EXISTS local_classrooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_code TEXT,
  last_synced_at TEXT
);

CREATE TABLE IF NOT EXISTS local_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  local_path TEXT,
  remote_path TEXT,
  downloaded INTEGER DEFAULT 0,
  text_content TEXT,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS local_assignments (
  id TEXT PRIMARY KEY,
  classroom_id TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  quiz_json TEXT NOT NULL,
  resource_ids_json TEXT NOT NULL,
  downloaded_at TEXT
);

CREATE TABLE IF NOT EXISTS local_submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  status TEXT NOT NULL,
  score REAL,
  max_score REAL,
  feedback_json TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS local_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;
