import type { IPBlockingAdapter } from './adapters/ip-blocking-adapter.interface.ts';
import type {
  BlockedIP,
  IPBlockingStats,
  WhitelistedIP
} from '../@types/blocked-ip.ts';
import { IPBlockingDuckDBAdapter } from './adapters/ip-blocking-duckdb-adapter.ts';
import { IPBlockingMemoryAdapter } from './adapters/ip-blocking-memory-adapter.ts';

/**
 * Factory singleton pour obtenir l'adapter de blocage d'IP approprié
 */
class IPBlockingStorageFactory {
  private adapter: IPBlockingAdapter | null = null;

  async getAdapter(): Promise<IPBlockingAdapter> {
    if (this.adapter) {
      return this.adapter;
    }

    // Déterminer quel backend utiliser
    const backend = Deno.env.get('IP_BLOCKING_STORAGE') || 'auto';

    // Priorité : IP_BLOCKING_DATABASE_URL > DATABASE_URL
    const databaseUrl = Deno.env.get('IP_BLOCKING_DATABASE_URL') ||
      Deno.env.get('DATABASE_URL');

    let selectedBackend: 'duckdb' | 'postgres' | 'memory';

    if (backend === 'auto') {
      // Auto-détection : si une DATABASE_URL existe → PostgreSQL, sinon → DuckDB
      selectedBackend = databaseUrl ? 'postgres' : 'duckdb';
    } else if (
      backend === 'postgres' ||
      backend === 'duckdb' ||
      backend === 'memory'
    ) {
      selectedBackend = backend;
    } else {
      // deno-lint-ignore no-console
      console.warn(
        `Unknown IP_BLOCKING_STORAGE: ${backend}, falling back to duckdb`
      );
      selectedBackend = 'duckdb';
    }

    // Créer l'adapter approprié
    if (selectedBackend === 'postgres') {
      if (!databaseUrl) {
        throw new Error(
          'IP_BLOCKING_DATABASE_URL or DATABASE_URL is required when using PostgreSQL for IP blocking'
        );
      }

      // Import dynamique pour éviter de charger postgres si non utilisé
      const { IPBlockingPostgresAdapter } = await import(
        './adapters/ip-blocking-postgres-adapter.ts'
      );
      this.adapter = new IPBlockingPostgresAdapter(databaseUrl);
    } else if (selectedBackend === 'memory') {
      this.adapter = new IPBlockingMemoryAdapter();
    } else {
      this.adapter = new IPBlockingDuckDBAdapter();
    }

    // Initialiser l'adapter
    await this.adapter.initialize();

    // deno-lint-ignore no-console
    console.log(`[IPBlocking] Using ${selectedBackend} adapter`);

    // Charger la whitelist depuis env si configurée
    await this.loadWhitelistFromEnv();

    return this.adapter;
  }

  /**
   * Charge les IP de la whitelist depuis la variable d'environnement
   * Format: IP_BLOCKING_WHITELIST=127.0.0.1,::1,192.168.1.1
   */
  private async loadWhitelistFromEnv(): Promise<void> {
    const whitelistEnv = Deno.env.get('IP_BLOCKING_WHITELIST');
    if (!whitelistEnv || !this.adapter) {
      return;
    }

    const ips = whitelistEnv.split(',').map((ip) => ip.trim()).filter(Boolean);

    if (ips.length === 0) {
      return;
    }

    // Importer la validation d'IP
    const { isValidIP, normalizeIP } = await import('../utils/ip-utils.ts');

    let loadedCount = 0;
    for (const rawIP of ips) {
      const normalizedIP = normalizeIP(rawIP);

      if (!isValidIP(normalizedIP)) {
        // deno-lint-ignore no-console
        console.warn(
          `[IPBlocking] Invalid IP in whitelist, skipping: ${rawIP}`
        );
        continue;
      }

      try {
        // Vérifier si déjà dans la whitelist
        const isAlreadyWhitelisted = await this.adapter.isWhitelisted(
          normalizedIP
        );

        if (!isAlreadyWhitelisted) {
          await this.adapter.addToWhitelist({
            ip: normalizedIP,
            addedAt: new Date(),
            addedBy: undefined, // Pas d'admin pour les IPs chargées depuis l'env
            reason: 'Loaded from IP_BLOCKING_WHITELIST env variable (system)'
          });
          loadedCount++;
        }
      } catch (error) {
        // deno-lint-ignore no-console
        console.error(
          `[IPBlocking] Failed to add IP to whitelist: ${rawIP}`,
          error
        );
      }
    }

    if (loadedCount > 0) {
      // deno-lint-ignore no-console
      console.log(
        `[IPBlocking] Loaded ${loadedCount} IP(s) into whitelist from env`
      );
    }
  }

  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
    }
  }
}

// Singleton global
export const ipBlockingStorageFactory = new IPBlockingStorageFactory();

// === Helper functions pour simplifier l'utilisation ===

/**
 * Bloque une IP
 */
export async function blockIP(block: BlockedIP): Promise<void> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  await adapter.blockIP(block);
}

/**
 * Débloque une IP
 * @returns true si l'IP était bloquée, false sinon
 */
export async function unblockIP(ip: string): Promise<boolean> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  return await adapter.unblockIP(ip);
}

/**
 * Vérifie si une IP est bloquée
 * @returns Les informations du blocage si bloquée, null sinon
 */
export async function isIPBlocked(ip: string): Promise<BlockedIP | null> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  return await adapter.isBlocked(ip);
}

/**
 * Récupère la liste des IP bloquées
 */
export async function getBlockedIPs(
  includeExpired = false
): Promise<BlockedIP[]> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  return await adapter.getBlockedIPs(includeExpired);
}

/**
 * Ajoute une IP à la whitelist
 */
export async function addToWhitelist(whitelist: WhitelistedIP): Promise<void> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  await adapter.addToWhitelist(whitelist);
}

/**
 * Retire une IP de la whitelist
 * @returns true si l'IP était whitelistée, false sinon
 */
export async function removeFromWhitelist(ip: string): Promise<boolean> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  return await adapter.removeFromWhitelist(ip);
}

/**
 * Vérifie si une IP est dans la whitelist
 */
export async function isIPWhitelisted(ip: string): Promise<boolean> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  return await adapter.isWhitelisted(ip);
}

/**
 * Récupère la liste des IP whitelistées
 */
export async function getWhitelistedIPs(): Promise<WhitelistedIP[]> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  return await adapter.getWhitelistedIPs();
}

/**
 * Nettoie les blocages expirés
 * @returns Le nombre de blocages supprimés
 */
export async function cleanupExpiredBlocks(): Promise<number> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  return await adapter.cleanupExpiredBlocks();
}

/**
 * Récupère les statistiques du système de blocage
 */
export async function getIPBlockingStats(): Promise<IPBlockingStats> {
  const adapter = await ipBlockingStorageFactory.getAdapter();
  return await adapter.getStats();
}
