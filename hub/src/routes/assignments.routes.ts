import { Router } from 'express';
import { z } from 'zod';
import {
  createAssignment,
  getAssignmentOrThrow,
  listAssignments,
  publishAssignment,
  toPublicAssignment,
} from '../services/assignment.service';
import { badRequest } from '../utils/errors';

export const assignmentsRouter = Router();

const questionSchema = z.object({
  id: z.string().default(''),
  type: z.enum(['multiple_choice', 'short_answer']),
  question: z.string().min(1),
  options: z.array(z.string()).default([]),
  answer: z.string().default(''),
  marks: z.number().default(1),
});

const createSchema = z.object({
  classroomId: z.string().min(1),
  title: z.string().min(1),
  instructions: z.string().optional(),
  resourceIds: z.array(z.string()).default([]),
  quiz: z.object({ questions: z.array(questionSchema).min(1) }),
  publish: z.boolean().optional(),
});

assignmentsRouter.post('/assignments', (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid assignment payload', parsed.error.flatten());
    const assignment = createAssignment(parsed.data);
    res.json({ assignment: toPublicAssignment(assignment) });
  } catch (err) {
    next(err);
  }
});

assignmentsRouter.get('/assignments', (req, res, next) => {
  try {
    const classroomId = req.query.classroomId as string | undefined;
    if (!classroomId) throw badRequest('classroomId query param is required');
    const includeDrafts = req.query.includeDrafts === 'true';
    const assignments = listAssignments(classroomId, !includeDrafts);
    res.json({ assignments: assignments.map(toPublicAssignment) });
  } catch (err) {
    next(err);
  }
});

assignmentsRouter.get('/assignments/:id', (req, res, next) => {
  try {
    const assignment = getAssignmentOrThrow(req.params.id);
    res.json({ assignment: toPublicAssignment(assignment) });
  } catch (err) {
    next(err);
  }
});

assignmentsRouter.post('/assignments/:id/publish', (req, res, next) => {
  try {
    const assignment = publishAssignment(req.params.id);
    res.json({ assignment: toPublicAssignment(assignment) });
  } catch (err) {
    next(err);
  }
});
