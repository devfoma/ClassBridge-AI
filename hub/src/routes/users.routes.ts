import { Router } from 'express';
import { z } from 'zod';
import { upsertUser } from '../services/classroom.service';
import { badRequest } from '../utils/errors';

export const usersRouter = Router();

const upsertSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(['teacher', 'student']),
  deviceId: z.string().optional(),
});

usersRouter.post('/users/upsert', (req, res, next) => {
  try {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid user payload', parsed.error.flatten());
    const user = upsertUser(parsed.data);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
