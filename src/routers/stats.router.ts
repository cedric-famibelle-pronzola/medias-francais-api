import { Hono } from '@hono/hono';
import { statsService } from '../services/stats.service.ts';

export const statsRouter = new Hono();

// GET /stats - Global statistics
statsRouter.get('/', (c) => {
  return c.json(statsService.global());
});

// GET /stats/concentration - Media concentration analysis
statsRouter.get('/concentration', (c) => {
  return c.json(statsService.concentration());
});
