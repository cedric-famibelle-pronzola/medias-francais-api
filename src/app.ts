import { Hono } from '@hono/hono';
import { logger } from '@hono/hono/logger';
import { prettyJSON } from '@hono/hono/pretty-json';
import { cors } from '@hono/hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { mediasRouter } from './routers/medias.router.ts';
import { personnesRouter } from './routers/personnes.router.ts';
import { organisationsRouter } from './routers/organisations.router.ts';
import { statsRouter } from './routers/stats.router.ts';
import { mediasService } from './services/medias.service.ts';
import { getOpenApiSpec } from './openapi.ts';
import { rateLimiter } from './middlewares/rate-limiter.ts';

const app = new Hono();
const API_BASE_PATH = Deno.env.get('API_BASE_PATH') || '/api';
const api = app.basePath(API_BASE_PATH);

// Middlewares
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors());

// Rate limiting for API routes
app.use(
  '/api/*',
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  })
);

// Swagger UI documentation (root)
app.get('/', swaggerUI({ url: '/openapi.json' }));
app.get('/openapi.json', (c) => {
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return c.json(getOpenApiSpec(baseUrl));
});

// Favicon
app.get('/favicon.ico', async (c) => {
  try {
    const favicon = await Deno.readFile('./src/medias-francais.ico');
    return c.body(favicon, 200, {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=86400'
    });
  } catch {
    return c.body(null, 204);
  }
});

// Robots.txt
app.get('/robots.txt', async (c) => {
  try {
    const robots = await Deno.readTextFile('./robots.txt');
    return c.text(robots, 200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    });
  } catch {
    return c.text('User-agent: *\nAllow: /', 200, {
      'Content-Type': 'text/plain'
    });
  }
});

// Root endpoint
api.get('/', (c) =>
  c.json({
    name: 'Médias Français API',
    version: '1.0.0',
    description: 'API sur la propriété des médias français',
    documentation: '/',
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
