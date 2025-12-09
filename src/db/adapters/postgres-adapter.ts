import pg from 'pg';
import type { LogAdapter } from './log-adapter.interface.ts';
import type { LogEntry } from '../../@types/log-entry.ts';

const { Pool } = pg;

/**
 * Adapter PostgreSQL pour le stockage des logs
 */
export class PostgresAdapter implements LogAdapter {
  private pool: pg.Pool | null = null;

  async initialize() {
    const databaseUrl = Deno.env.get('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is required for PostgreSQL adapter'
      );
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 10, // Max 10 connexions dans le pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    // Créer la table si elle n'existe pas
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        level VARCHAR(10) NOT NULL,
        method VARCHAR(10) NOT NULL,
        path TEXT NOT NULL,
        query TEXT,
        status SMALLINT NOT NULL,
        duration INTEGER NOT NULL,
        ip INET,
        user_agent TEXT,
        request_id VARCHAR(36) NOT NULL,
        referer TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Créer les index pour améliorer les performances des requêtes
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC)
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_status ON logs(status)
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_path ON logs(path)
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_request_id ON logs(request_id)
    `);
  }

  async insertLog(log: LogEntry): Promise<void> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    await this.pool.query(
      `
      INSERT INTO logs (
        timestamp, level, method, path, query, status, duration,
        ip, user_agent, request_id, referer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
      [
        log.timestamp,
        log.level,
        log.method,
        log.path,
        log.query,
        log.status,
        log.duration,
        log.ip,
        log.userAgent,
        log.requestId,
        log.referer || null
      ]
    );
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
}
