import { Router } from 'express';
import { z } from 'zod';
import {
  createClassroom,
  getClassroomByCode,
  getClassroomDetail,
  joinClassroom,
  listClassroomsForTeacher,
} from '../services/classroom.service';
import { badRequest, notFound } from '../utils/errors';

export const classroomsRouter = Router();

const createSchema = z.object({
  teacherId: z.string().min(1),
  name: z.string().min(1),
});

classroomsRouter.post('/classrooms', (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid classroom payload', parsed.error.flatten());
    const classroom = createClassroom(parsed.data);
    res.json({ id: classroom.id, name: classroom.name, classCode: classroom.class_code });
  } catch (err) {
    next(err);
  }
});

// List classrooms for a teacher: GET /classrooms?teacherId=...
classroomsRouter.get('/classrooms', (req, res, next) => {
  try {
    const teacherId = req.query.teacherId as string | undefined;
    if (!teacherId) throw badRequest('teacherId query param is required');
    res.json({ classrooms: listClassroomsForTeacher(teacherId) });
  } catch (err) {
    next(err);
  }
});

classroomsRouter.get('/classrooms/by-code/:classCode', (req, res, next) => {
  try {
    const classroom = getClassroomByCode(req.params.classCode);
    if (!classroom) throw notFound('No classroom found for that code');
    res.json({ classroom });
  } catch (err) {
    next(err);
  }
});

const joinSchema = z.object({
  classCode: z.string().min(1),
  student: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    deviceId: z.string().optional(),
  }),
});

classroomsRouter.post('/classrooms/join', (req, res, next) => {
  try {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid join payload', parsed.error.flatten());
    const result = joinClassroom(parsed.data);
    res.json({ classroom: result.classroom, student: result.student, member: result.member });
  } catch (err) {
    next(err);
  }
});

classroomsRouter.get('/classrooms/:id', (req, res, next) => {
  try {
    const detail = getClassroomDetail(req.params.id);
    res.json({ classroom: detail });
  } catch (err) {
    next(err);
  }
});
