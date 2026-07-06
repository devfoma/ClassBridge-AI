import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { badRequest } from '../utils/errors';
import { createTextResource, createFileResource } from './resource.service';
import { Resource } from '../types/resource';

interface PackManifest {
  packId: string;
  title: string;
  subject: string;
  level: string;
  language?: string;
  resources: Array<{ title: string; type: string; path: string }>;
}

function readManifest(dir: string): PackManifest {
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw badRequest(`No manifest.json found in pack folder: ${dir}`);
  }
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  let manifest: PackManifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    throw badRequest(`Invalid manifest.json: ${(err as Error).message}`);
  }
  if (!Array.isArray(manifest.resources)) {
    throw badRequest('manifest.json must contain a "resources" array');
  }
  return manifest;
}

/** Import a content pack from a folder path containing a manifest.json. */
export function importPackFromFolder(folderPath: string): Resource[] {
  const dir = path.isAbsolute(folderPath)
    ? folderPath
    : path.resolve(process.cwd(), folderPath);
  if (!fs.existsSync(dir)) throw badRequest(`Pack folder not found: ${dir}`);

  const manifest = readManifest(dir);
  const created: Resource[] = [];

  for (const item of manifest.resources) {
    const resourcePath = path.join(dir, item.path);
    if (!fs.existsSync(resourcePath)) {
      throw badRequest(`Resource file missing in pack: ${item.path}`);
    }
    if (item.type === 'text' || /\.(txt|md)$/i.test(item.path)) {
      const textContent = fs.readFileSync(resourcePath, 'utf-8');
      created.push(
        createTextResource({
          title: item.title,
          textContent,
          subject: manifest.subject,
          level: manifest.level,
          metadata: { packId: manifest.packId, packTitle: manifest.title, language: manifest.language },
        })
      );
    } else {
      const buffer = fs.readFileSync(resourcePath);
      created.push(
        createFileResource({
          title: item.title,
          originalName: path.basename(item.path),
          buffer,
          subject: manifest.subject,
          level: manifest.level,
        })
      );
    }
  }

  return created;
}

/** Import a content pack from an uploaded ZIP buffer. */
export function importPackFromZip(zipBuffer: Buffer): Resource[] {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const manifestEntry = entries.find((e) => e.entryName.endsWith('manifest.json'));
  if (!manifestEntry) throw badRequest('ZIP does not contain a manifest.json');

  const manifest = JSON.parse(manifestEntry.getData().toString('utf-8')) as PackManifest;
  const baseDir = path.dirname(manifestEntry.entryName);
  const created: Resource[] = [];

  for (const item of manifest.resources) {
    const entryName = path.posix.join(baseDir, item.path);
    const entry = entries.find((e) => e.entryName === entryName || e.entryName.endsWith(item.path));
    if (!entry) throw badRequest(`Resource file missing in ZIP: ${item.path}`);

    const data = entry.getData();
    if (item.type === 'text' || /\.(txt|md)$/i.test(item.path)) {
      created.push(
        createTextResource({
          title: item.title,
          textContent: data.toString('utf-8'),
          subject: manifest.subject,
          level: manifest.level,
          metadata: { packId: manifest.packId, packTitle: manifest.title },
        })
      );
    } else {
      created.push(
        createFileResource({
          title: item.title,
          originalName: path.basename(item.path),
          buffer: data,
          subject: manifest.subject,
          level: manifest.level,
        })
      );
    }
  }
  return created;
}
