import { Context, Next } from '@hono/hono';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Error message
  keyGenerator?: (c: Context) => string; // Custom key generator
}

const defaultOptions: RateLimiterOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
};

export function rateLimiter(options: Partial<RateLimiterOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  const store: RateLimitStore = {};

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, config.windowMs);

  return async (c: Context, next: Next) => {
    // Generate key (default: IP address)
    const key = config.keyGenerator
      ? config.keyGenerator(c)
      : getClientIP(c);

    const now = Date.now();

    // Initialize or reset if window expired
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }

    // Increment counter
    store[key].count++;

    // Calculate remaining
    const remaining = Math.max(0, config.max - store[key].count);
    const resetTime = Math.ceil(store[key].resetTime / 1000);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', config.max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetTime.toString());

    // Check if limit exceeded
    if (store[key].count > config.max) {
      c.header('Retry-After', Math.ceil((store[key].resetTime - now) / 1000).toString());
      return c.json(
        {
          error: {
            code: 429,
            message: config.message
          }
        },
        429
      );
    }

    await next();
  };
}

function getClientIP(c: Context): string {
  // Check various headers for client IP
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = c.req.header('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection info (Deno specific)
  // @ts-ignore - Deno specific
  const connInfo = c.env?.remoteAddr;
  if (connInfo) {
    return connInfo.hostname || 'unknown';
  }

  return 'unknown';
}
