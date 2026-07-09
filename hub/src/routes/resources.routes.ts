import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { z } from 'zod';
import {
  createFileResource,
  getResourceOrThrow,
  listResources,
  resolveResourceFilePath,
  toPublicResource,
} from '../services/resource.service';
import { importPackFromFolder, importPackFromZip } from '../services/pack.service';
import { badRequest } from '../utils/errors';

export const resourcesRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload a single resource file (text-first for MVP).
resourcesRouter.post('/resources/upload', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) throw badRequest('A file is required (multipart field "file")');
    const title = (req.body.title as string) || req.file.originalname;
    const resource = createFileResource({
      title,
      originalName: req.file.originalname,
      buffer: req.file.buffer,
      subject: req.body.subject,
      level: req.body.level,
    });
    res.json({ resource: toPublicResource(resource, false) });
  } catch (err) {
    next(err);
  }
});

const importSchema = z.object({ packPath: z.string().min(1) });

// Import a content pack. Accepts a ZIP upload (field "file") or a JSON body { packPath }.
// Idempotent: re-importing a pack (or a double-tapped import) reuses previously
// imported resources instead of creating duplicates (see findResourceBySource).
resourcesRouter.post('/resources/import-pack', upload.single('file'), (req, res, next) => {
  try {
    if (req.file) {
      const result = importPackFromZip(req.file.buffer);
      res.json({
        resources: result.resources.map((r) => toPublicResource(r, false)),
        importedCount: result.importedCount,
        skippedCount: result.skippedCount,
      });
      return;
    }
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Provide a ZIP file or { packPath }', parsed.error.flatten());
    const result = importPackFromFolder(parsed.data.packPath);
    res.json({
      resources: result.resources.map((r) => toPublicResource(r, false)),
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
    });
  } catch (err) {
    next(err);
  }
});

resourcesRouter.get('/resources', (_req, res, next) => {
  try {
    res.json({ resources: listResources().map((r) => toPublicResource(r, false)) });
  } catch (err) {
    next(err);
  }
});

resourcesRouter.get('/resources/:id', (req, res, next) => {
  try {
    const resource = getResourceOrThrow(req.params.id);
    res.json({ resource: toPublicResource(resource, true) });
  } catch (err) {
    next(err);
  }
});

resourcesRouter.get('/resources/:id/download', (req, res, next) => {
  try {
    const resource = getResourceOrThrow(req.params.id);
    const filePath = resolveResourceFilePath(resource);
    if (!filePath || !fs.existsSync(filePath)) {
      // No stored file: serve text content as a .txt download instead.
      if (resource.text_content != null) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${resource.title}.txt"`);
        res.send(resource.text_content);
        return;
      }
      throw badRequest('This resource has no downloadable file');
    }
    res.download(filePath, `${resource.title}`);
  } catch (err) {
    next(err);
  }
});
