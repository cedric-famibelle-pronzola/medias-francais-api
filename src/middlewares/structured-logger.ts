import type { Context, Next } from '@hono/hono';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  method: string;
  path: string;
  status: number;
  duration: number;
  ip: string;
  userAgent: string;
  requestId: string;
}

/**
 * Middleware pour logs structurés en JSON
 */
export function structuredLogger() {
  return async (c: Context, next: Next) => {
    const start = performance.now();
    const requestId = crypto.randomUUID().substring(0, 8);

    // Ajouter le request ID au header de réponse
    c.header('X-Request-ID', requestId);

    await next();

    const duration = Math.round(performance.now() - start);
    const status = c.res.status;

    // Récupérer l'IP client (proxy headers ou localhost)
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      c.req.header('cf-connecting-ip') ||
      (c.env?.remoteAddr as { hostname?: string })?.hostname ||
      '127.0.0.1';

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status,
      duration,
      ip,
      userAgent: c.req.header('user-agent') || 'unknown',
      requestId
    };

    // deno-lint-ignore no-console
    console.log(JSON.stringify(logEntry));
  };
}
