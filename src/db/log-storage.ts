import type { LogAdapter } from './adapters/log-adapter.interface.ts';
import { DuckDBAdapter } from './adapters/duckdb-adapter.ts';

/**
 * Factory singleton pour obtenir l'adapter de logs approprié
 */
class LogStorageFactory {
  private adapter: LogAdapter | null = null;

  async getAdapter(): Promise<LogAdapter> {
    if (this.adapter) {
      return this.adapter;
    }

    // Déterminer quel backend utiliser
    const backend = Deno.env.get('LOG_STORAGE_BACKEND') || 'auto';
    const databaseUrl = Deno.env.get('DATABASE_URL');

    let selectedBackend: 'duckdb' | 'postgres';

    if (backend === 'auto') {
      // Auto-détection : si DATABASE_URL existe → PostgreSQL, sinon → DuckDB
      selectedBackend = databaseUrl ? 'postgres' : 'duckdb';
    } else if (backend === 'postgres' || backend === 'duckdb') {
      selectedBackend = backend;
    } else {
      // deno-lint-ignore no-console
      console.warn(
        `Unknown LOG_STORAGE_BACKEND: ${backend}, falling back to duckdb`
      );
      selectedBackend = 'duckdb';
    }

    // Créer l'adapter approprié
    if (selectedBackend === 'postgres') {
      // Import dynamique pour éviter de charger pg si non utilisé
      const { PostgresAdapter } = await import(
        './adapters/postgres-adapter.ts'
      );
      this.adapter = new PostgresAdapter();
    } else {
      this.adapter = new DuckDBAdapter();
    }

    // Initialiser l'adapter
    await this.adapter.initialize();

    // deno-lint-ignore no-console
    console.log(`[LogStorage] Using ${selectedBackend} adapter`);

    return this.adapter;
  }

  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
    }
  }
}

// Singleton global
export const logStorageFactory = new LogStorageFactory();

/**
 * Helper pour insérer un log (utilise la factory)
 */
export async function insertLog(
  log: Parameters<LogAdapter['insertLog']>[0]
): Promise<void> {
  const adapter = await logStorageFactory.getAdapter();
  await adapter.insertLog(log);
}
