import { join } from '@std/path';
import { DuckDBInstanceCache } from '@duckdb/node-api';
import type { LogAdapter } from './log-adapter.interface.ts';
import type { LogEntry } from '../../@types/log-entry.ts';
import type { DuckDBInstance } from '@duckdb/node-api';

/**
 * Adapter DuckDB pour le stockage des logs
 */
export class DuckDBAdapter implements LogAdapter {
  private instance: DuckDBInstance | null = null;
  private connection: Awaited<ReturnType<DuckDBInstance['connect']>> | null =
    null;

  async initialize() {
    const dirname = import.meta.dirname!;
    const logDir = join(dirname, '../../../logs');

    const cache = new DuckDBInstanceCache();
    this.instance = await cache.getOrCreateInstance(
      `${logDir}/access_logs.db`,
      {
        threads: '4'
      }
    );

    this.connection = await this.instance.connect();

    // Créer la table si elle n'existe pas
    await this.connection.run(`
      CREATE TABLE IF NOT EXISTS logs (
        log JSON
      )
    `);
  }

  async insertLog(log: LogEntry): Promise<void> {
    if (!this.connection) {
      throw new Error('DuckDB connection not initialized');
    }

    await this.connection.run(`INSERT INTO logs VALUES (?)`, [
      JSON.stringify(log)
    ]);
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    this.instance = null;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.connection) {
      return false;
    }

    try {
      await this.connection.run('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
