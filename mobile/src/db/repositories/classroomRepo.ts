import { getMobileDb } from '../mobileDb';
import { LocalClassroom } from '../../types/classroom';

interface ClassroomRow {
  id: string;
  name: string;
  class_code: string | null;
  last_synced_at: string | null;
}

function toClassroom(r: ClassroomRow): LocalClassroom {
  return { id: r.id, name: r.name, classCode: r.class_code, lastSyncedAt: r.last_synced_at };
}

export async function upsertClassroom(c: LocalClassroom): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync(
    `INSERT INTO local_classrooms (id, name, class_code, last_synced_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name,
       class_code = COALESCE(excluded.class_code, local_classrooms.class_code),
       last_synced_at = excluded.last_synced_at`,
    c.id,
    c.name,
    c.classCode,
    c.lastSyncedAt
  );
}

export async function listClassrooms(): Promise<LocalClassroom[]> {
  const db = await getMobileDb();
  const rows = await db.getAllAsync<ClassroomRow>('SELECT * FROM local_classrooms ORDER BY name ASC');
  return rows.map(toClassroom);
}

export async function getClassroom(id: string): Promise<LocalClassroom | null> {
  const db = await getMobileDb();
  const row = await db.getFirstAsync<ClassroomRow>('SELECT * FROM local_classrooms WHERE id = ?', id);
  return row ? toClassroom(row) : null;
}

export async function touchClassroomSync(id: string, syncedAt: string): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('UPDATE local_classrooms SET last_synced_at = ? WHERE id = ?', syncedAt, id);
}
