import { Router } from 'express';
import { z } from 'zod';
import { upsertUser } from '../services/classroom.service';
import { badRequest } from '../utils/errors';

export const usersRouter = Router();

const upsertSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional().nullable(),
  passwordHash: z.string().optional().nullable(),
  name: z.string().min(1),
  role: z.enum(['teacher', 'student']),
  deviceId: z.string().optional().nullable(),
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

const loginSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(1),
});

usersRouter.post('/users/login', (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid login payload', parsed.error.flatten());
    
    // Using require for cyclic/late binding if needed, but we can import loginUser directly at top
    const { loginUser } = require('../services/classroom.service');
    const user = loginUser(parsed.data.email, parsed.data.passwordHash);
    
    if (!user) throw badRequest('Invalid email or password');
    
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
