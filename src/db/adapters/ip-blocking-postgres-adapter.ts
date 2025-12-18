import pg from 'pg';
import type { IPBlockingAdapter } from './ip-blocking-adapter.interface.ts';
import type {
  BlockedIP,
  IPBlockingStats,
  WhitelistedIP
} from '../../@types/blocked-ip.ts';
import { ipToCIDR, removeCIDRSuffix } from '../../utils/ip-utils.ts';

const { Pool } = pg;

/**
 * Adapter PostgreSQL pour le stockage des IP bloquées
 * Utilise une base PostgreSQL distante avec connection pooling
 */
export class IPBlockingPostgresAdapter implements IPBlockingAdapter {
  private pool: pg.Pool | null = null;

  constructor(private readonly databaseUrl: string) {}

  async initialize(): Promise<void> {
    if (!this.databaseUrl) {
      throw new Error(
        'Database URL is required for PostgreSQL adapter'
      );
    }

    this.pool = new Pool({
      connectionString: this.databaseUrl,
      max: 10, // Pool de 10 connexions max
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    // Créer les tables si elles n'existent pas
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        ip CIDR NOT NULL PRIMARY KEY,
        reason TEXT NOT NULL,
        blocked_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ,
        source VARCHAR(10) NOT NULL CHECK (source IN ('system', 'admin')),
        blocked_by_ip CIDR,
        blocked_by_identifier VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Index partiel pour optimiser le cleanup des expirés
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires_at
      ON blocked_ips(expires_at)
      WHERE expires_at IS NOT NULL
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS whitelisted_ips (
        ip CIDR NOT NULL PRIMARY KEY,
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        added_by_ip CIDR,
        added_by_identifier VARCHAR(255),
        reason TEXT
      )
    `);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  // === Opérations de blocage ===

  async blockIP(block: BlockedIP): Promise<void> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    // Upsert : INSERT ... ON CONFLICT DO UPDATE
    await this.pool.query(
      `
      INSERT INTO blocked_ips
      (ip, reason, blocked_at, expires_at, source, blocked_by_ip, blocked_by_identifier, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (ip) DO UPDATE SET
        reason = EXCLUDED.reason,
        blocked_at = EXCLUDED.blocked_at,
        expires_at = EXCLUDED.expires_at,
        source = EXCLUDED.source,
        blocked_by_ip = EXCLUDED.blocked_by_ip,
        blocked_by_identifier = EXCLUDED.blocked_by_identifier,
        metadata = EXCLUDED.metadata
    `,
      [
        ipToCIDR(block.ip),
        block.reason,
        block.blockedAt,
        block.expiresAt || null,
        block.source,
        block.blockedBy?.ip ? ipToCIDR(block.blockedBy.ip) : null,
        block.blockedBy?.identifier || null,
        block.metadata ? JSON.stringify(block.metadata) : null
      ]
    );
  }

  async unblockIP(ip: string): Promise<boolean> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const result = await this.pool.query(
      'DELETE FROM blocked_ips WHERE ip = $1',
      [ipToCIDR(ip)]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async isBlocked(ip: string): Promise<BlockedIP | null> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    // Vérifier whitelist en priorité
    const isWhitelisted = await this.isWhitelisted(ip);
    if (isWhitelisted) {
      return null;
    }

    // Vérifier blocage (en excluant les expirés)
    const result = await this.pool.query(
      `
      SELECT * FROM blocked_ips
      WHERE ip = $1
      AND (expires_at IS NULL OR expires_at > NOW())
    `,
      [ipToCIDR(ip)]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToBlockedIP(result.rows[0]);
  }

  async getBlockedIPs(includeExpired = false): Promise<BlockedIP[]> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const result = includeExpired
      ? await this.pool.query('SELECT * FROM blocked_ips')
      : await this.pool.query(
        `
          SELECT * FROM blocked_ips
          WHERE expires_at IS NULL OR expires_at > NOW()
        `
      );

    // deno-lint-ignore no-explicit-any
    return result.rows.map((row: any) => this.rowToBlockedIP(row));
  }

  // === Opérations de whitelist ===

  async addToWhitelist(whitelist: WhitelistedIP): Promise<void> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    await this.pool.query(
      `
      INSERT INTO whitelisted_ips
      (ip, added_at, added_by_ip, added_by_identifier, reason)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (ip) DO UPDATE SET
        added_at = EXCLUDED.added_at,
        added_by_ip = EXCLUDED.added_by_ip,
        added_by_identifier = EXCLUDED.added_by_identifier,
        reason = EXCLUDED.reason
    `,
      [
        ipToCIDR(whitelist.ip),
        whitelist.addedAt,
        whitelist.addedBy?.ip ? ipToCIDR(whitelist.addedBy.ip) : null,
        whitelist.addedBy?.identifier || null,
        whitelist.reason || null
      ]
    );
  }

  async removeFromWhitelist(ip: string): Promise<boolean> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const result = await this.pool.query(
      'DELETE FROM whitelisted_ips WHERE ip = $1',
      [ipToCIDR(ip)]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async isWhitelisted(ip: string): Promise<boolean> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const result = await this.pool.query(
      'SELECT ip FROM whitelisted_ips WHERE ip = $1',
      [ipToCIDR(ip)]
    );

    return result.rows.length > 0;
  }

  async getWhitelistedIPs(): Promise<WhitelistedIP[]> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const result = await this.pool.query('SELECT * FROM whitelisted_ips');

    // deno-lint-ignore no-explicit-any
    return result.rows.map((row: any) => this.rowToWhitelistedIP(row));
  }

  // === Maintenance ===

  async cleanupExpiredBlocks(): Promise<number> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const result = await this.pool.query(
      `
      DELETE FROM blocked_ips
      WHERE expires_at IS NOT NULL
      AND expires_at <= NOW()
    `
    );

    return result.rowCount ?? 0;
  }

  async getStats(): Promise<IPBlockingStats> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    // Compter les blocages
    const blockedResult = await this.pool.query(`
      SELECT
        COUNT(*) as total_blocked,
        SUM(CASE WHEN expires_at IS NULL OR expires_at > NOW() THEN 1 ELSE 0 END) as active_blocks,
        SUM(CASE WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 1 ELSE 0 END) as expired_blocks,
        SUM(CASE WHEN source = 'system' THEN 1 ELSE 0 END) as system_blocks,
        SUM(CASE WHEN source = 'admin' THEN 1 ELSE 0 END) as admin_blocks
      FROM blocked_ips
    `);

    const blockedRow = blockedResult.rows[0];

    // Compter les whitelisted
    const whitelistResult = await this.pool.query(
      'SELECT COUNT(*) as total FROM whitelisted_ips'
    );
    const whitelistRow = whitelistResult.rows[0];

    return {
      totalBlocked: parseInt(blockedRow.total_blocked) || 0,
      totalWhitelisted: parseInt(whitelistRow.total) || 0,
      activeBlocks: parseInt(blockedRow.active_blocks) || 0,
      expiredBlocks: parseInt(blockedRow.expired_blocks) || 0,
      systemBlocks: parseInt(blockedRow.system_blocks) || 0,
      adminBlocks: parseInt(blockedRow.admin_blocks) || 0
    };
  }

  // === Helpers privés ===

  // deno-lint-ignore no-explicit-any
  private rowToBlockedIP(row: any): BlockedIP {
    return {
      ip: removeCIDRSuffix(String(row.ip)),
      reason: String(row.reason),
      blockedAt: new Date(row.blocked_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      source: String(row.source) as 'system' | 'admin',
      blockedBy: row.blocked_by_ip || row.blocked_by_identifier
        ? {
          ip: removeCIDRSuffix(String(row.blocked_by_ip || '')),
          identifier: row.blocked_by_identifier
            ? String(row.blocked_by_identifier)
            : undefined
        }
        : undefined,
      metadata: row.metadata
        ? (row.metadata as Record<string, unknown>)
        : undefined
    };
  }

  // deno-lint-ignore no-explicit-any
  private rowToWhitelistedIP(row: any): WhitelistedIP {
    return {
      ip: removeCIDRSuffix(String(row.ip)),
      addedAt: new Date(row.added_at),
      addedBy: row.added_by_ip || row.added_by_identifier
        ? {
          ip: removeCIDRSuffix(String(row.added_by_ip || '')),
          identifier: row.added_by_identifier
            ? String(row.added_by_identifier)
            : undefined
        }
        : undefined,
      reason: row.reason ? String(row.reason) : undefined
    };
  }
}
