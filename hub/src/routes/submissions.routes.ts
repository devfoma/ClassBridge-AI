import { Router } from 'express';
import {
  listSubmissionsByAssignment,
  listSubmissionsByClassroom,
} from '../services/submission.service';
import { badRequest } from '../utils/errors';

export const submissionsRouter = Router();

// GET /submissions?classroomId=... or ?assignmentId=...
submissionsRouter.get('/submissions', (req, res, next) => {
  try {
    const classroomId = req.query.classroomId as string | undefined;
    const assignmentId = req.query.assignmentId as string | undefined;

    if (assignmentId) {
      res.json({ submissions: listSubmissionsByAssignment(assignmentId) });
      return;
    }
    if (classroomId) {
      res.json({ submissions: listSubmissionsByClassroom(classroomId) });
      return;
    }
    throw badRequest('Provide classroomId or assignmentId query param');
  } catch (err) {
    next(err);
  }
});
