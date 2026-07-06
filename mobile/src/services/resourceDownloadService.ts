import { ResourcePublic } from '../types/resource';
import { LocalResource } from '../types/resource';
import { upsertResource, markDownloaded } from '../db/repositories/resourceRepo';
import { saveResourceText, downloadResourceFile } from './fileService';

/**
 * Persist pulled resource metadata locally, and download content so the student
 * can open lessons fully offline:
 *  - text content -> stored in SQLite AND written to a local .txt file
 *  - file resources -> downloaded via Expo FileSystem into the app document dir
 */
export async function saveResourcesForOffline(
  hubUrl: string,
  resources: ResourcePublic[]
): Promise<void> {
  for (const r of resources) {
    const local: LocalResource = {
      id: r.id,
      title: r.title,
      type: r.type,
      localPath: null,
      remotePath: `${hubUrl.replace(/\/+$/, '')}/resources/${r.id}/download`,
      downloaded: 0,
      textContent: r.textContent ?? null,
      metadataJson: JSON.stringify({ subject: r.subject, level: r.level, summary: r.summary }),
    };
    await upsertResource(local);

    try {
      if (r.textContent != null) {
        const path = await saveResourceText(r.id, r.textContent);
        await markDownloaded(r.id, path);
      } else if (r.hasFile && local.remotePath) {
        const path = await downloadResourceFile(local.remotePath, r.id);
        await markDownloaded(r.id, path);
      }
    } catch {
      // Text content is already stored in SQLite; a failed file download simply
      // leaves downloaded = 0. The lesson text remains readable offline.
    }
  }
}
