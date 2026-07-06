import { Router } from 'express';
import { getClassroomInsight } from '../services/insight.service';
import { GemmaUnavailableError } from '../types/gemma';
import { serviceUnavailable } from '../utils/errors';

export const insightsRouter = Router();

insightsRouter.get('/insights/classroom/:classroomId', async (req, res, next) => {
  try {
    const insight = await getClassroomInsight(req.params.classroomId);
    res.json(insight);
  } catch (err) {
    if (err instanceof GemmaUnavailableError) {
      next(
        serviceUnavailable('Gemma is unavailable for insights.', { reason: err.message })
      );
      return;
    }
    next(err);
  }
});
