import { Hono } from '@hono/hono';
import { logger } from '@hono/hono/logger';
import { prettyJSON } from '@hono/hono/pretty-json';
import { cors } from '@hono/hono/cors';
import { mediasRouter } from './routers/medias.router.ts';
import { personnesRouter } from './routers/personnes.router.ts';
import { organisationsRouter } from './routers/organisations.router.ts';
import { statsRouter } from './routers/stats.router.ts';
import { mediasService } from './services/medias.service.ts';

const app = new Hono();
const API_BASE_PATH = Deno.env.get('API_BASE_PATH') || '/api';
const api = app.basePath(API_BASE_PATH);

// Middlewares
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors());

// Root endpoint
api.get('/', (c) =>
  c.json({
    name: 'Médias Français API',
    version: '1.0.0',
    description: 'API sur la propriété des médias français',
    endpoints: {
      medias: `${API_BASE_PATH}/medias`,
      personnes: `${API_BASE_PATH}/personnes`,
      organisations: `${API_BASE_PATH}/organisations`,
      stats: `${API_BASE_PATH}/stats`,
      types: `${API_BASE_PATH}/types`,
      echelles: `${API_BASE_PATH}/echelles`
    }
  }));

// Routes
api.route('/medias', mediasRouter);
api.route('/personnes', personnesRouter);
api.route('/organisations', organisationsRouter);
api.route('/stats', statsRouter);

// Référentiels (root level)
api.get('/types', (c) => {
  return c.json({
    types: mediasService.getTypes()
  });
});

api.get('/echelles', (c) => {
  return c.json({
    echelles: mediasService.getEchelles()
  });
});

// 404 handler
app.notFound((c) =>
  c.json(
    {
      error: {
        code: 404,
        message: 'Route non trouvée'
      }
    },
    404
  )
);

// Error handler
app.onError((err, c) => {
  // deno-lint-ignore no-console
  console.error(`${err}`);
  return c.json(
    {
      error: {
        code: 500,
        message: 'Erreur serveur interne'
      }
    },
    500
  );
});

export default app;
