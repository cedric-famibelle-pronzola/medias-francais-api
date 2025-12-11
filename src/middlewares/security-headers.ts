import type { Context, Next } from '@hono/hono';

/**
 * Middleware pour ajouter les headers de sécurité
 */
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();

    const env = Deno.env.get('ENVIRONMENT') || 'development';
    const isDev = env === 'development';

    // Content-Security-Policy
    const csp = isDev
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; connect-src 'self'"
      : [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');

    c.header('Content-Security-Policy', csp);

    // HSTS (HTTPS uniquement)
    if (!isDev && c.req.url.startsWith('https://')) {
      c.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Protection clickjacking
    c.header('X-Frame-Options', 'DENY');

    // Empêche MIME sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // Protection XSS (legacy)
    c.header('X-XSS-Protection', '1; mode=block');

    // Contrôle referer
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Désactive fonctionnalités non utilisées
    c.header(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );
  };
}
