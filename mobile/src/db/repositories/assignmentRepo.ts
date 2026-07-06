import { getMobileDb } from '../mobileDb';
import { LocalAssignment } from '../../types/assignment';
import { Quiz } from '../../types/quiz';
import { safeParse } from '../../utils/safeJson';
import { nowIso } from '../../utils/dates';

interface AssignmentRow {
  id: string;
  classroom_id: string;
  title: string;
  instructions: string | null;
  quiz_json: string;
  resource_ids_json: string;
  downloaded_at: string | null;
}

function toAssignment(r: AssignmentRow): LocalAssignment {
  return {
    id: r.id,
    classroomId: r.classroom_id,
    title: r.title,
    instructions: r.instructions,
    quiz: safeParse<Quiz>(r.quiz_json, { questions: [] }),
    resourceIds: safeParse<string[]>(r.resource_ids_json, []),
    downloadedAt: r.downloaded_at,
  };
}

export async function upsertAssignment(a: LocalAssignment): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync(
    `INSERT INTO local_assignments (id, classroom_id, title, instructions, quiz_json, resource_ids_json, downloaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, instructions = excluded.instructions,
       quiz_json = excluded.quiz_json, resource_ids_json = excluded.resource_ids_json,
       downloaded_at = COALESCE(local_assignments.downloaded_at, excluded.downloaded_at)`,
    a.id,
    a.classroomId,
    a.title,
    a.instructions,
    JSON.stringify(a.quiz),
    JSON.stringify(a.resourceIds),
    a.downloadedAt
  );
}

export async function markAssignmentDownloaded(id: string): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('UPDATE local_assignments SET downloaded_at = ? WHERE id = ?', nowIso(), id);
}

export async function listAssignments(): Promise<LocalAssignment[]> {
  const db = await getMobileDb();
  const rows = await db.getAllAsync<AssignmentRow>('SELECT * FROM local_assignments ORDER BY title ASC');
  return rows.map(toAssignment);
}

export async function listAssignmentsByClassroom(classroomId: string): Promise<LocalAssignment[]> {
  const db = await getMobileDb();
  const rows = await db.getAllAsync<AssignmentRow>(
    'SELECT * FROM local_assignments WHERE classroom_id = ? ORDER BY title ASC',
    classroomId
  );
  return rows.map(toAssignment);
}

export async function getAssignment(id: string): Promise<LocalAssignment | null> {
  const db = await getMobileDb();
  const row = await db.getFirstAsync<AssignmentRow>('SELECT * FROM local_assignments WHERE id = ?', id);
  return row ? toAssignment(row) : null;
}
