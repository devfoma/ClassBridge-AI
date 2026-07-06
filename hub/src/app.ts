import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.routes';
import { usersRouter } from './routes/users.routes';
import { classroomsRouter } from './routes/classrooms.routes';
import { resourcesRouter } from './routes/resources.routes';
import { gemmaRouter } from './routes/gemma.routes';
import { assignmentsRouter } from './routes/assignments.routes';
import { submissionsRouter } from './routes/submissions.routes';
import { syncRouter } from './routes/sync.routes';
import { insightsRouter } from './routes/insights.routes';
import { HttpError } from './utils/errors';
import { config } from './config';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(healthRouter);
  app.use(usersRouter);
  app.use(classroomsRouter);
  app.use(resourcesRouter);
  app.use(gemmaRouter);
  app.use(assignmentsRouter);
  app.use(submissionsRouter);
  app.use(syncRouter);
  app.use(insightsRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: { message: `Not found: ${req.method} ${req.path}` } });
  });

  // Central error handler: never leak raw stack traces to clients.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: { message: err.message, details: err.details } });
      return;
    }
    if (!config.isTest) {
      // eslint-disable-next-line no-console
      console.error('[hub] Unhandled error:', err);
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: { message } });
  });

  return app;
}
