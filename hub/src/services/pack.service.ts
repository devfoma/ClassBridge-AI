import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { badRequest } from '../utils/errors';
import { createTextResource, createFileResource, findResourceBySource } from './resource.service';
import { Resource } from '../types/resource';

interface PackManifest {
  packId: string;
  title: string;
  subject: string;
  level: string;
  language?: string;
  resources: Array<{ title: string; type: string; path: string }>;
}

export interface PackImportResult {
  resources: Resource[];
  /** Resources newly created by this call. */
  importedCount: number;
  /** Pack items that were already imported previously and were left untouched. */
  skippedCount: number;
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
export function importPackFromFolder(folderPath: string): PackImportResult {
  const dir = path.isAbsolute(folderPath)
    ? folderPath
    : path.resolve(process.cwd(), folderPath);
  if (!fs.existsSync(dir)) throw badRequest(`Pack folder not found: ${dir}`);

  const manifest = readManifest(dir);
  const resources: Resource[] = [];
  let importedCount = 0;
  let skippedCount = 0;

  for (const item of manifest.resources) {
    // Already imported from this exact pack item: reuse it instead of creating a duplicate.
    const existing = findResourceBySource(manifest.packId, item.path);
    if (existing) {
      resources.push(existing);
      skippedCount += 1;
      continue;
    }

    const resourcePath = path.join(dir, item.path);
    if (!fs.existsSync(resourcePath)) {
      throw badRequest(`Resource file missing in pack: ${item.path}`);
    }
    const metadata = {
      packId: manifest.packId,
      packTitle: manifest.title,
      sourcePath: item.path,
    };
    if (item.type === 'text' || /\.(txt|md)$/i.test(item.path)) {
      const textContent = fs.readFileSync(resourcePath, 'utf-8');
      resources.push(
        createTextResource({
          title: item.title,
          textContent,
          subject: manifest.subject,
          level: manifest.level,
          metadata: { ...metadata, language: manifest.language },
        })
      );
    } else {
      const buffer = fs.readFileSync(resourcePath);
      resources.push(
        createFileResource({
          title: item.title,
          originalName: path.basename(item.path),
          buffer,
          subject: manifest.subject,
          level: manifest.level,
          metadata,
        })
      );
    }
    importedCount += 1;
  }

  return { resources, importedCount, skippedCount };
}

/** Import a content pack from an uploaded ZIP buffer. */
export function importPackFromZip(zipBuffer: Buffer): PackImportResult {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const manifestEntry = entries.find((e) => e.entryName.endsWith('manifest.json'));
  if (!manifestEntry) throw badRequest('ZIP does not contain a manifest.json');

  const manifest = JSON.parse(manifestEntry.getData().toString('utf-8')) as PackManifest;
  const baseDir = path.dirname(manifestEntry.entryName);
  const resources: Resource[] = [];
  let importedCount = 0;
  let skippedCount = 0;

  for (const item of manifest.resources) {
    // Already imported from this exact pack item: reuse it instead of creating a duplicate.
    const existing = findResourceBySource(manifest.packId, item.path);
    if (existing) {
      resources.push(existing);
      skippedCount += 1;
      continue;
    }

    const entryName = path.posix.join(baseDir, item.path);
    const entry = entries.find((e) => e.entryName === entryName || e.entryName.endsWith(item.path));
    if (!entry) throw badRequest(`Resource file missing in ZIP: ${item.path}`);

    const data = entry.getData();
    const metadata = { packId: manifest.packId, packTitle: manifest.title, sourcePath: item.path };
    if (item.type === 'text' || /\.(txt|md)$/i.test(item.path)) {
      resources.push(
        createTextResource({
          title: item.title,
          textContent: data.toString('utf-8'),
          subject: manifest.subject,
          level: manifest.level,
          metadata,
        })
      );
    } else {
      resources.push(
        createFileResource({
          title: item.title,
          originalName: path.basename(item.path),
          buffer: data,
          subject: manifest.subject,
          level: manifest.level,
          metadata,
        })
      );
    }
    importedCount += 1;
  }
  return { resources, importedCount, skippedCount };
}
