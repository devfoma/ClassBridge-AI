import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import { newId } from '../utils/ids';
import { nowIso } from '../utils/dates';
import { notFound } from '../utils/errors';
import { Resource, ResourcePublic, ResourceType } from '../types/resource';

export const STORAGE_DIR = path.resolve(__dirname, '..', 'storage');
export const RESOURCES_DIR = path.join(STORAGE_DIR, 'resources');

function ensureStorage(): void {
  if (!fs.existsSync(RESOURCES_DIR)) fs.mkdirSync(RESOURCES_DIR, { recursive: true });
}

function isTextFile(filename: string): boolean {
  return /\.(txt|md|csv)$/i.test(filename);
}

export function createTextResource(input: {
  title: string;
  textContent: string;
  subject?: string;
  level?: string;
  metadata?: Record<string, unknown>;
}): Resource {
  const db = getDb();
  const resource: Resource = {
    id: newId('res'),
    title: input.title,
    type: 'text',
    file_path: null,
    text_content: input.textContent,
    subject: input.subject ?? null,
    level: input.level ?? null,
    summary: null,
    metadata_json: input.metadata ? JSON.stringify(input.metadata) : null,
    created_at: nowIso(),
  };
  insertResource(resource);
  return resource;
}

/**
 * Persist an uploaded file. For text files we also store the extracted content
 * so students can read it fully offline (MVP: text-first extraction).
 */
export function createFileResource(input: {
  title: string;
  originalName: string;
  buffer: Buffer;
  subject?: string;
  level?: string;
}): Resource {
  ensureStorage();
  const ext = path.extname(input.originalName) || '.txt';
  const storedName = `${newId('file')}${ext}`;
  const filePath = path.join(RESOURCES_DIR, storedName);
  fs.writeFileSync(filePath, input.buffer);

  const textContent = isTextFile(input.originalName) ? input.buffer.toString('utf-8') : null;
  const type: ResourceType = textContent != null ? 'text' : 'file';

  const resource: Resource = {
    id: newId('res'),
    title: input.title,
    type,
    file_path: storedName,
    text_content: textContent,
    subject: input.subject ?? null,
    level: input.level ?? null,
    summary: null,
    metadata_json: JSON.stringify({ originalName: input.originalName }),
    created_at: nowIso(),
  };
  insertResource(resource);
  return resource;
}

function insertResource(r: Resource): void {
  getDb()
    .prepare(
      `INSERT INTO resources
       (id, title, type, file_path, text_content, subject, level, summary, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      r.id,
      r.title,
      r.type,
      r.file_path,
      r.text_content,
      r.subject,
      r.level,
      r.summary,
      r.metadata_json,
      r.created_at
    );
}

export function getResource(id: string): Resource | undefined {
  return getDb().prepare('SELECT * FROM resources WHERE id = ?').get(id) as Resource | undefined;
}

export function getResourceOrThrow(id: string): Resource {
  const r = getResource(id);
  if (!r) throw notFound(`Resource "${id}" not found`);
  return r;
}

export function listResources(): Resource[] {
  return getDb().prepare('SELECT * FROM resources ORDER BY created_at DESC').all() as Resource[];
}

export function updateResourceSummary(id: string, summary: string, metadata?: Record<string, unknown>): void {
  const db = getDb();
  const existing = getResourceOrThrow(id);
  const merged = {
    ...(existing.metadata_json ? JSON.parse(existing.metadata_json) : {}),
    ...(metadata || {}),
  };
  db.prepare('UPDATE resources SET summary = ?, metadata_json = ? WHERE id = ?').run(
    summary,
    JSON.stringify(merged),
    id
  );
}

export function resolveResourceFilePath(r: Resource): string | null {
  if (!r.file_path) return null;
  return path.join(RESOURCES_DIR, r.file_path);
}

export function toPublicResource(r: Resource, includeText = true): ResourcePublic {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    subject: r.subject,
    level: r.level,
    summary: r.summary,
    textContent: includeText ? r.text_content : undefined,
    hasFile: !!r.file_path,
    createdAt: r.created_at,
  };
}
