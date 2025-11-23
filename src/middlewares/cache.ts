import type { Context, Next } from '@hono/hono';

interface CacheOptions {
  maxAge?: number; // seconds
  private?: boolean;
}

const defaultOptions: CacheOptions = {
  maxAge: 300, // 5 minutes
  private: false
};

/**
 * Middleware pour ajouter les headers de cache HTTP
 */
export function cache(options: Partial<CacheOptions> = {}) {
  const config = { ...defaultOptions, ...options };

  return async (c: Context, next: Next) => {
    await next();

    // Ne pas cacher les erreurs
    if (c.res.status >= 400) {
      c.header('Cache-Control', 'no-store');
      return;
    }

    // Cache-Control header
    const visibility = config.private ? 'private' : 'public';
    c.header('Cache-Control', `${visibility}, max-age=${config.maxAge}`);

    // ETag basé sur le contenu (pour les réponses JSON)
    const contentType = c.res.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await c.res.clone().text();
        const encoder = new TextEncoder();
        const data = encoder.encode(body);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const etag = `"${hashHex.substring(0, 16)}"`;

        c.header('ETag', etag);

        // Vérifier If-None-Match
        const ifNoneMatch = c.req.header('If-None-Match');
        if (ifNoneMatch === etag) {
          c.res = new Response(null, { status: 304 });
        }
      } catch {
        // Ignorer les erreurs de génération d'ETag
      }
    }
  };
}
