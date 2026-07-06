import { getMobileDb } from '../mobileDb';
import { LocalResource, ResourceType } from '../../types/resource';

interface ResourceRow {
  id: string;
  title: string;
  type: string;
  local_path: string | null;
  remote_path: string | null;
  downloaded: number;
  text_content: string | null;
  metadata_json: string | null;
}

function toResource(r: ResourceRow): LocalResource {
  return {
    id: r.id,
    title: r.title,
    type: r.type as ResourceType,
    localPath: r.local_path,
    remotePath: r.remote_path,
    downloaded: r.downloaded,
    textContent: r.text_content,
    metadataJson: r.metadata_json,
  };
}

export async function upsertResource(r: LocalResource): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync(
    `INSERT INTO local_resources (id, title, type, local_path, remote_path, downloaded, text_content, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, type = excluded.type,
       local_path = COALESCE(excluded.local_path, local_resources.local_path),
       remote_path = excluded.remote_path,
       downloaded = MAX(excluded.downloaded, local_resources.downloaded),
       text_content = COALESCE(excluded.text_content, local_resources.text_content),
       metadata_json = excluded.metadata_json`,
    r.id,
    r.title,
    r.type,
    r.localPath,
    r.remotePath,
    r.downloaded,
    r.textContent,
    r.metadataJson
  );
}

export async function markDownloaded(id: string, localPath: string | null): Promise<void> {
  const db = await getMobileDb();
  await db.runAsync('UPDATE local_resources SET downloaded = 1, local_path = ? WHERE id = ?', localPath, id);
}

export async function getResource(id: string): Promise<LocalResource | null> {
  const db = await getMobileDb();
  const row = await db.getFirstAsync<ResourceRow>('SELECT * FROM local_resources WHERE id = ?', id);
  return row ? toResource(row) : null;
}

export async function getResourcesByIds(ids: string[]): Promise<LocalResource[]> {
  if (ids.length === 0) return [];
  const db = await getMobileDb();
  const placeholders = ids.map(() => '?').join(',');
  const rows = await db.getAllAsync<ResourceRow>(
    `SELECT * FROM local_resources WHERE id IN (${placeholders})`,
    ...ids
  );
  return rows.map(toResource);
}

export async function listResources(): Promise<LocalResource[]> {
  const db = await getMobileDb();
  const rows = await db.getAllAsync<ResourceRow>('SELECT * FROM local_resources ORDER BY title ASC');
  return rows.map(toResource);
}

export async function countDownloaded(): Promise<number> {
  const db = await getMobileDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM local_resources WHERE downloaded = 1'
  );
  return row?.c ?? 0;
}
