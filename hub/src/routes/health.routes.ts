import { Router } from 'express';
import { config } from '../config';
import { nowIso } from '../utils/dates';
import { gemmaStatus } from '../services/gemma.service';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    hubName: config.hubName,
    version: config.version,
    time: nowIso(),
  });
});

// Deeper status incl. Gemma reachability (used by mobile Settings screen).
healthRouter.get('/health/gemma', async (_req, res) => {
  const status = await gemmaStatus();
  res.json({ status: 'ok', gemma: status, time: nowIso() });
});
