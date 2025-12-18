import type { Context, Next } from '@hono/hono';
import { isIPBlocked } from '../db/ip-blocking-storage.ts';
import { getClientIP } from '../utils/ip-utils.ts';
import { IPBlockedError } from '../errors.ts';

/**
 * Middleware de blocage d'IP
 *
 * Vérifie si l'IP du client est bloquée avant de permettre l'accès.
 * La whitelist est automatiquement vérifiée par isIPBlocked().
 *
 * Placement dans la chaîne middleware :
 * Security Headers → Logger → CORS → [IP Blocking] → Rate Limiter → Routes
 *
 * Stratégie fail-open par défaut :
 * - Si la base de données est indisponible, la requête est autorisée (availability > security)
 * - Configurable via IP_BLOCKING_FAIL_CLOSED=true pour un comportement fail-closed
 */
export async function ipBlockingMiddleware(c: Context, next: Next) {
  // Extraire l'IP du client
  const clientIP = getClientIP(c);

  // Si IP inconnue, permettre mais logger un avertissement
  if (clientIP === 'unknown') {
    // deno-lint-ignore no-console
    console.warn('[IPBlocking] Unable to detect client IP, allowing request');
    return await next();
  }

  // Déterminer la stratégie en cas d'erreur DB
  const failClosed = Deno.env.get('IP_BLOCKING_FAIL_CLOSED') === 'true';

  try {
    // Vérifier si l'IP est bloquée (vérifie aussi la whitelist automatiquement)
    const blockInfo = await isIPBlocked(clientIP);

    if (blockInfo) {
      // IP bloquée : retourner 403
      throw new IPBlockedError(
        `Access denied: Your IP address (${clientIP}) has been blocked`,
        {
          reason: blockInfo.reason,
          source: blockInfo.source,
          expiresAt: blockInfo.expiresAt
        }
      );
    }

    // IP non bloquée : continuer
    return await next();
  } catch (error) {
    // Si c'est une IPBlockedError, la propager
    if (error instanceof IPBlockedError) {
      throw error;
    }

    // Erreur de base de données ou autre erreur technique
    // deno-lint-ignore no-console
    console.error('[IPBlocking] Error checking blocked IP:', error);

    // Stratégie fail-open : permettre la requête en cas d'erreur DB
    if (!failClosed) {
      // deno-lint-ignore no-console
      console.warn(
        `[IPBlocking] DB error for IP ${clientIP}, allowing request (fail-open)`
      );
      return await next();
    }

    // Stratégie fail-closed : bloquer la requête en cas d'erreur DB
    // deno-lint-ignore no-console
    console.warn(
      `[IPBlocking] DB error for IP ${clientIP}, blocking request (fail-closed)`
    );
    throw new IPBlockedError(
      'Access temporarily unavailable due to security system maintenance',
      {
        reason: 'Database error (fail-closed mode)',
        source: 'system',
        expiresAt: null
      }
    );
  }
}
