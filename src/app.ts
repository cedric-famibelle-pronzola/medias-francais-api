import { Hono } from '@hono/hono';
import { logger } from '@hono/hono/logger';
import { prettyJSON } from '@hono/hono/pretty-json';
import { cors } from '@hono/hono/cors';
import { compress } from '@hono/hono/compress';
import { swaggerUI } from '@hono/swagger-ui';
import { mediasRouter } from './routers/medias.router.ts';
import { personnesRouter } from './routers/personnes.router.ts';
import { organisationsRouter } from './routers/organisations.router.ts';
import { statsRouter } from './routers/stats.router.ts';
import { mediasService } from './services/medias.service.ts';
import { getOpenApiSpec } from './openapi.ts';
import { rateLimiter } from './middlewares/rate-limiter.ts';
import { cache } from './middlewares/cache.ts';
import { structuredLogger } from './middlewares/structured-logger.ts';
import { ApiError } from './errors.ts';
import { getCacheStats, invalidateCache } from './data/cache.ts';

const app = new Hono();
const API_BASE_PATH = Deno.env.get('API_BASE_PATH') || '/';
const api = app.basePath(API_BASE_PATH);

// Middlewares
const isProduction = Deno.env.get('ENVIRONMENT') === 'production';

if (isProduction) {
  app.use('*', structuredLogger());
} else {
  app.use('*', logger());
}

app.use('*', compress({ threshold: 1024 })); // Only compress responses > 1KB
app.use('*', prettyJSON());

// CORS configuration
const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';
app.use(
  '*',
  cors({
    origin: (origin): string => {
      // Allow all origins in development
      if (isDevelopment) {
        return origin;
      }

      // In production, whitelist specific domains
      const allowedOrigins = [
        'https://medias-francais.com',
        'https://www.medias-francais.com',
        /^https:\/\/.*\.medias-francais\.com$/ // All subdomains
      ];

      // Check if origin is allowed
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') return allowed === origin;
        return allowed.test(origin);
      });

      return isAllowed ? origin : allowedOrigins[0] as string;
    },
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
    credentials: false
  })
);

// Differentiated rate limiting by endpoint type
const searchPattern = API_BASE_PATH === '/'
  ? '/*/search*'
  : `${API_BASE_PATH}/*/search*`;
const apiPattern = API_BASE_PATH === '/' ? '/*' : `${API_BASE_PATH}/*`;

// More restrictive rate limiting for search endpoints (expensive operations)
app.use(
  searchPattern,
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: 'Trop de recherches, veuillez patienter.'
  })
);

// Standard rate limiting for other API routes
app.use(
  apiPattern,
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  })
);

// Cache headers for API routes
app.use(apiPattern, cache({ maxAge: 300 })); // 5 minutes

// Note: /health, /favicon.ico, /robots.txt are not rate limited (before apiPattern)

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

// Health check
app.get('/health', (c) => {
  return c.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(performance.now() / 1000)
    },
    200,
    {
      'Cache-Control': 'no-store'
    }
  );
});

// Cache stats endpoint (for monitoring)
app.get('/cache/stats', (c) => {
  return c.json(getCacheStats(), 200, {
    'Cache-Control': 'no-store'
  });
});

// Cache invalidation endpoint (admin only, should be protected in production)
app.post('/cache/invalidate', (c) => {
  // In production, this should require authentication
  if (!isDevelopment) {
    const adminKey = c.req.header('X-Admin-Key');
    if (adminKey !== Deno.env.get('ADMIN_KEY')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }

  invalidateCache();
  return c.json({ success: true, message: 'Cache invalidated' });
});

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

// Enhanced error handler with unique error IDs
app.onError((err, c) => {
  const errorId = crypto.randomUUID();

  // Log error with unique ID for tracking
  const logData = {
    errorId,
    name: err.name,
    message: err.message,
    path: c.req.path,
    method: c.req.method
  };

  // Handle custom API errors
  if (err instanceof ApiError) {
    // deno-lint-ignore no-console
    console.error('[API Error]', logData);

    const errorResponse: Record<string, unknown> = {
      id: errorId,
      code: err.code,
      message: err.message
    };

    if (err.details !== undefined) {
      errorResponse.details = err.details;
    }

    return c.json(
      { error: errorResponse },
      err.statusCode as 400 | 401 | 403 | 404 | 429 | 500
    );
  }

  // Log unexpected errors with full stack trace
  // deno-lint-ignore no-console
  console.error('[Unexpected Error]', {
    ...logData,
    stack: err.stack
  });

  // Return generic error for unexpected errors (don't leak internals)
  return c.json(
    {
      error: {
        id: errorId,
        code: 'INTERNAL_ERROR',
        message: isDevelopment ? err.message : 'Une erreur interne est survenue'
      }
    },
    500
  );
});

export default app;
