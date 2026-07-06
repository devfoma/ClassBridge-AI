import { Router } from 'express';
import { z } from 'zod';
import { pullUpdates, pushSubmissions } from '../services/sync.service';
import { badRequest } from '../utils/errors';

export const syncRouter = Router();

// GET /sync/pull?studentId=...&classroomId=...&since=...
syncRouter.get('/sync/pull', (req, res, next) => {
  try {
    const studentId = req.query.studentId as string | undefined;
    if (!studentId) throw badRequest('studentId query param is required');
    const classroomId = req.query.classroomId as string | undefined;
    const since = req.query.since as string | undefined;
    res.json(pullUpdates({ studentId, classroomId, since }));
  } catch (err) {
    next(err);
  }
});

const pushSchema = z.object({
  studentId: z.string().min(1),
  deviceId: z.string().min(1),
  submissions: z
    .array(
      z.object({
        id: z.string().min(1),
        assignmentId: z.string().min(1),
        answers: z.array(z.object({ questionId: z.string(), answer: z.string() })),
        submittedAt: z.string().optional(),
      })
    )
    .default([]),
});

syncRouter.post('/sync/push', async (req, res, next) => {
  try {
    const parsed = pushSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid push payload', parsed.error.flatten());
    const result = await pushSubmissions(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
