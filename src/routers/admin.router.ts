import { Hono } from '@hono/hono';
import type { Context, Next } from '@hono/hono';
import type { BlockIPRequest } from '../@types/blocked-ip.ts';
import {
  addToWhitelist,
  blockIP,
  cleanupExpiredBlocks,
  getBlockedIPs,
  getIPBlockingStats,
  getWhitelistedIPs,
  isIPBlocked,
  isIPWhitelisted,
  removeFromWhitelist,
  unblockIP
} from '../db/ip-blocking-storage.ts';
import { getClientIP, isValidIP, normalizeIP } from '../utils/ip-utils.ts';
import { BadRequestError, ValidationError } from '../errors.ts';

/**
 * Router pour l'administration du système de blocage d'IP
 *
 * Tous les endpoints nécessitent une authentification via header X-Admin-Key
 */
export const adminRouter = new Hono();

// Middleware d'authentification admin
async function adminAuth(c: Context, next: Next) {
  const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';

  // Vérifier l'authentification uniquement en production
  if (!isDevelopment) {
    const adminKey = c.req.header('X-Admin-Key');
    const expectedKey = Deno.env.get('ADMIN_KEY');

    if (!expectedKey) {
      throw new BadRequestError(
        'ADMIN_KEY not configured on server'
      );
    }

    if (adminKey !== expectedKey) {
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing admin key'
          }
        },
        401
      );
    }
  }

  await next();
}

// Appliquer l'auth sur toutes les routes admin
adminRouter.use('/ip-blocking/*', adminAuth);

/**
 * Helper pour valider et normaliser une IP
 * @throws ValidationError si l'IP est invalide
 */
function validateAndNormalizeIP(ip: string, fieldName = 'ip'): string {
  if (!ip || typeof ip !== 'string') {
    throw new ValidationError('IP address is required', fieldName);
  }

  const normalizedIP = normalizeIP(ip);
  if (!isValidIP(normalizedIP)) {
    throw new ValidationError(`Invalid IP address: ${ip}`, fieldName);
  }

  return normalizedIP;
}

/**
 * POST /admin/ip-blocking/block
 * Bloquer une IP manuellement
 */
adminRouter.post('/ip-blocking/block', async (c) => {
  // Valider que le body existe et est du JSON valide
  let body: BlockIPRequest;
  try {
    body = await c.req.json() as BlockIPRequest;
  } catch (error) {
    throw new BadRequestError(
      'Invalid or missing JSON body',
      {
        error: error instanceof Error ? error.message : 'Failed to parse JSON',
        expected: {
          ip: 'string (required)',
          reason: 'string (required)',
          duration: 'number (optional, in minutes)',
          identifier: 'string (optional)',
          metadata: 'object (optional)'
        }
      }
    );
  }

  // Validation des champs
  if (!body.reason || typeof body.reason !== 'string') {
    throw new ValidationError('Reason is required', 'reason');
  }

  // Valider et normaliser l'IP
  const normalizedIP = validateAndNormalizeIP(body.ip);

  // Détection de l'IP admin
  const adminIP = getClientIP(c);

  // Empêcher de se bloquer soi-même
  if (normalizedIP === adminIP && adminIP !== 'unknown') {
    throw new BadRequestError(
      'Cannot block your own IP address',
      { requestedIP: normalizedIP, yourIP: adminIP }
    );
  }

  // Calculer expiresAt si duration fournie
  const expiresAt = body.duration
    ? new Date(Date.now() + body.duration * 60 * 1000)
    : null;

  // Bloquer l'IP
  await blockIP({
    ip: normalizedIP,
    reason: body.reason,
    blockedAt: new Date(),
    expiresAt,
    source: 'admin',
    blockedBy: {
      ip: adminIP,
      identifier: body.identifier
    },
    metadata: body.metadata
  });

  return c.json(
    {
      success: true,
      blocked: {
        ip: normalizedIP,
        reason: body.reason,
        expiresAt: expiresAt?.toISOString() || null,
        blockedBy: {
          ip: adminIP,
          identifier: body.identifier
        }
      }
    },
    201
  );
});

/**
 * DELETE /admin/ip-blocking/unblock/:ip
 * Débloquer une IP
 */
adminRouter.delete('/ip-blocking/unblock/:ip', async (c) => {
  const ip = c.req.param('ip');
  const normalizedIP = validateAndNormalizeIP(ip);

  const wasBlocked = await unblockIP(normalizedIP);

  if (!wasBlocked) {
    return c.json(
      {
        success: false,
        message: 'IP was not blocked'
      },
      404
    );
  }

  return c.json({
    success: true,
    message: `IP ${normalizedIP} has been unblocked`
  });
});

/**
 * GET /admin/ip-blocking/list
 * Lister les IP bloquées
 */
adminRouter.get('/ip-blocking/list', async (c) => {
  const includeExpired = c.req.query('includeExpired') === 'true';

  const blockedIPs = await getBlockedIPs(includeExpired);

  return c.json({
    count: blockedIPs.length,
    includeExpired,
    blockedIPs: blockedIPs.map((block) => ({
      ip: block.ip,
      reason: block.reason,
      blockedAt: block.blockedAt.toISOString(),
      expiresAt: block.expiresAt?.toISOString() || null,
      source: block.source,
      blockedBy: block.blockedBy,
      metadata: block.metadata
    }))
  });
});

/**
 * POST /admin/ip-blocking/whitelist/add
 * Ajouter une IP à la whitelist
 */
adminRouter.post('/ip-blocking/whitelist/add', async (c) => {
  // Valider que le body existe et est du JSON valide
  let body: {
    ip: string;
    reason?: string;
    identifier?: string;
  };
  try {
    body = await c.req.json() as {
      ip: string;
      reason?: string;
      identifier?: string;
    };
  } catch (error) {
    throw new BadRequestError(
      'Invalid or missing JSON body',
      {
        error: error instanceof Error ? error.message : 'Failed to parse JSON',
        expected: {
          ip: 'string (required)',
          reason: 'string (optional)',
          identifier: 'string (optional)'
        }
      }
    );
  }

  const normalizedIP = validateAndNormalizeIP(body.ip);
  const adminIP = getClientIP(c);

  await addToWhitelist({
    ip: normalizedIP,
    addedAt: new Date(),
    addedBy: {
      ip: adminIP,
      identifier: body.identifier
    },
    reason: body.reason
  });

  return c.json(
    {
      success: true,
      whitelisted: {
        ip: normalizedIP,
        reason: body.reason,
        addedBy: {
          ip: adminIP,
          identifier: body.identifier
        }
      }
    },
    201
  );
});

/**
 * DELETE /admin/ip-blocking/whitelist/remove/:ip
 * Retirer une IP de la whitelist
 */
adminRouter.delete('/ip-blocking/whitelist/remove/:ip', async (c) => {
  const ip = c.req.param('ip');
  const normalizedIP = validateAndNormalizeIP(ip);

  const wasWhitelisted = await removeFromWhitelist(normalizedIP);

  if (!wasWhitelisted) {
    return c.json(
      {
        success: false,
        message: 'IP was not whitelisted'
      },
      404
    );
  }

  return c.json({
    success: true,
    message: `IP ${normalizedIP} has been removed from whitelist`
  });
});

/**
 * GET /admin/ip-blocking/whitelist
 * Lister les IP whitelistées
 */
adminRouter.get('/ip-blocking/whitelist', async (c) => {
  const whitelistedIPs = await getWhitelistedIPs();

  return c.json({
    count: whitelistedIPs.length,
    whitelistedIPs: whitelistedIPs.map((whitelist) => ({
      ip: whitelist.ip,
      addedAt: whitelist.addedAt.toISOString(),
      addedBy: whitelist.addedBy,
      reason: whitelist.reason
    }))
  });
});

/**
 * POST /admin/ip-blocking/cleanup
 * Nettoyer les blocages expirés
 */
adminRouter.post('/ip-blocking/cleanup', async (c) => {
  const deletedCount = await cleanupExpiredBlocks();

  return c.json({
    success: true,
    deletedCount,
    message: `Cleaned up ${deletedCount} expired block(s)`
  });
});

/**
 * GET /admin/ip-blocking/stats
 * Récupérer les statistiques du système de blocage
 */
adminRouter.get('/ip-blocking/stats', async (c) => {
  const stats = await getIPBlockingStats();

  return c.json({
    stats
  });
});

/**
 * GET /admin/ip-blocking/check/:ip
 * Vérifier le statut d'une IP (bloquée ou whitelistée)
 */
adminRouter.get('/ip-blocking/check/:ip', async (c) => {
  const ip = c.req.param('ip');
  const normalizedIP = validateAndNormalizeIP(ip);

  const [blockInfo, isWhitelisted] = await Promise.all([
    isIPBlocked(normalizedIP),
    isIPWhitelisted(normalizedIP)
  ]);

  return c.json({
    ip: normalizedIP,
    isBlocked: blockInfo !== null,
    isWhitelisted,
    blockInfo: blockInfo
      ? {
        reason: blockInfo.reason,
        blockedAt: blockInfo.blockedAt.toISOString(),
        expiresAt: blockInfo.expiresAt?.toISOString() || null,
        source: blockInfo.source,
        blockedBy: blockInfo.blockedBy,
        metadata: blockInfo.metadata
      }
      : null
  });
});
