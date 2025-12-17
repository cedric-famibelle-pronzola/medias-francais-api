import { Context, Next } from '@hono/hono';
import { blockIP, isIPWhitelisted } from '../db/ip-blocking-storage.ts';
import { getClientIP } from '../utils/ip-utils.ts';

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

interface AutoBlockConfig {
  enabled: boolean;
  threshold: number; // Nombre de violations avant auto-block
  duration: number; // Durée du blocage en minutes
}

const defaultOptions: RateLimiterOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
};

// Store pour tracer les violations par IP
const violationStore: { [ip: string]: number } = {};

export function rateLimiter(options: Partial<RateLimiterOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  const store: RateLimitStore = {};
  let lastCleanup = Date.now();

  // Configuration de l'auto-block depuis les variables d'environnement
  const autoBlockConfig: AutoBlockConfig = {
    enabled: Deno.env.get('AUTO_BLOCK_ENABLED') === 'true',
    threshold: parseInt(Deno.env.get('AUTO_BLOCK_THRESHOLD') || '10', 10),
    duration: parseInt(Deno.env.get('AUTO_BLOCK_DURATION') || '60', 10)
  };

  return async (c: Context, next: Next) => {
    const now = Date.now();

    // Cleanup old entries periodically (every window)
    if (now - lastCleanup > config.windowMs) {
      for (const key in store) {
        if (store[key].resetTime < now) {
          delete store[key];
          // Nettoyer aussi le violationStore pour éviter les fuites mémoire
          if (violationStore[key]) {
            delete violationStore[key];
          }
        }
      }
      lastCleanup = now;
    }

    // Generate key (default: IP address)
    const key = config.keyGenerator ? config.keyGenerator(c) : getClientIP(c);

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
      // Auto-blocking logic
      if (autoBlockConfig.enabled && key !== 'unknown') {
        // Incrémenter le compteur de violations
        violationStore[key] = (violationStore[key] || 0) + 1;

        // Si le seuil est atteint, bloquer l'IP
        if (violationStore[key] >= autoBlockConfig.threshold) {
          // Vérifier la whitelist avant de bloquer
          isIPWhitelisted(key)
            .then((isWhitelisted) => {
              if (!isWhitelisted) {
                // Bloquer l'IP (appel non-bloquant)
                const expiresAt = new Date(
                  Date.now() + autoBlockConfig.duration * 60 * 1000
                );

                blockIP({
                  ip: key,
                  reason: `Auto-block: ${
                    violationStore[key]
                  } rate-limit violations`,
                  blockedAt: new Date(),
                  expiresAt,
                  source: 'system',
                  metadata: {
                    violations: violationStore[key],
                    endpoint: c.req.path,
                    userAgent: c.req.header('user-agent')
                  }
                })
                  .then(() => {
                    // deno-lint-ignore no-console
                    console.log(
                      `[RateLimiter] Auto-blocked IP ${key} after ${
                        violationStore[key]
                      } violations`
                    );
                  })
                  .catch((err) => {
                    // deno-lint-ignore no-console
                    console.error(
                      `[RateLimiter] Failed to auto-block IP ${key}:`,
                      err
                    );
                  });
              } else {
                // deno-lint-ignore no-console
                console.log(
                  `[RateLimiter] IP ${key} reached violation threshold but is whitelisted`
                );
              }
            })
            .catch((err) => {
              // deno-lint-ignore no-console
              console.error(
                '[RateLimiter] Failed to check whitelist:',
                err
              );
            });

          // Reset le compteur de violations après tentative de blocage
          delete violationStore[key];
        }
      }

      c.header(
        'Retry-After',
        Math.ceil((store[key].resetTime - now) / 1000).toString()
      );
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
