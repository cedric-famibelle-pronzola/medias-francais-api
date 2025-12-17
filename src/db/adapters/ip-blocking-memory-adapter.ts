import type { IPBlockingAdapter } from './ip-blocking-adapter.interface.ts';
import type {
  BlockedIP,
  IPBlockingStats,
  WhitelistedIP
} from '../../@types/blocked-ip.ts';

/**
 * Adapter mémoire pour le stockage des IP bloquées
 * Utilisé principalement pour les tests et le développement
 *
 * ATTENTION : Les données sont perdues au redémarrage de l'application
 */
export class IPBlockingMemoryAdapter implements IPBlockingAdapter {
  private blockedIPs: Map<string, BlockedIP> = new Map();
  private whitelistedIPs: Set<string> = new Set();
  private whitelistDetails: Map<string, WhitelistedIP> = new Map();

  async initialize(): Promise<void> {
    // No-op pour l'adapter mémoire
    await Promise.resolve();
  }

  async close(): Promise<void> {
    await Promise.resolve();
    // Nettoyer les structures de données
    this.blockedIPs.clear();
    this.whitelistedIPs.clear();
    this.whitelistDetails.clear();
  }

  async healthCheck(): Promise<boolean> {
    // Toujours opérationnel en mémoire
    return await Promise.resolve(true);
  }

  // === Opérations de blocage ===

  async blockIP(block: BlockedIP): Promise<void> {
    await Promise.resolve();
    this.blockedIPs.set(block.ip, block);
  }

  async unblockIP(ip: string): Promise<boolean> {
    await Promise.resolve();
    const existed = this.blockedIPs.has(ip);
    this.blockedIPs.delete(ip);
    return existed;
  }

  async isBlocked(ip: string): Promise<BlockedIP | null> {
    await Promise.resolve();
    // Vérifier la whitelist en priorité
    if (this.whitelistedIPs.has(ip)) {
      return null;
    }

    const block = this.blockedIPs.get(ip);
    if (!block) {
      return null;
    }

    // Vérifier l'expiration
    if (block.expiresAt && block.expiresAt <= new Date()) {
      // Cleanup lazy : supprimer si expiré
      this.blockedIPs.delete(ip);
      return null;
    }

    return block;
  }

  async getBlockedIPs(includeExpired = false): Promise<BlockedIP[]> {
    await Promise.resolve();
    const now = new Date();
    const result: BlockedIP[] = [];

    for (const block of this.blockedIPs.values()) {
      // Vérifier expiration
      const isExpired = block.expiresAt && block.expiresAt <= now;

      if (!isExpired || includeExpired) {
        result.push(block);
      }
    }

    return result;
  }

  // === Opérations de whitelist ===

  async addToWhitelist(whitelist: WhitelistedIP): Promise<void> {
    await Promise.resolve();
    this.whitelistedIPs.add(whitelist.ip);
    this.whitelistDetails.set(whitelist.ip, whitelist);
  }

  async removeFromWhitelist(ip: string): Promise<boolean> {
    await Promise.resolve();
    const existed = this.whitelistedIPs.has(ip);
    this.whitelistedIPs.delete(ip);
    this.whitelistDetails.delete(ip);
    return existed;
  }

  async isWhitelisted(ip: string): Promise<boolean> {
    await Promise.resolve();
    return this.whitelistedIPs.has(ip);
  }

  async getWhitelistedIPs(): Promise<WhitelistedIP[]> {
    await Promise.resolve();
    return Array.from(this.whitelistDetails.values());
  }

  // === Maintenance ===

  async cleanupExpiredBlocks(): Promise<number> {
    await Promise.resolve();
    const now = new Date();
    let count = 0;

    for (const [ip, block] of this.blockedIPs.entries()) {
      if (block.expiresAt && block.expiresAt <= now) {
        this.blockedIPs.delete(ip);
        count++;
      }
    }

    return count;
  }

  async getStats(): Promise<IPBlockingStats> {
    await Promise.resolve();
    const now = new Date();
    let activeBlocks = 0;
    let expiredBlocks = 0;
    let systemBlocks = 0;
    let adminBlocks = 0;

    for (const block of this.blockedIPs.values()) {
      const isExpired = block.expiresAt && block.expiresAt <= now;

      if (isExpired) {
        expiredBlocks++;
      } else {
        activeBlocks++;
      }

      if (block.source === 'system') {
        systemBlocks++;
      } else {
        adminBlocks++;
      }
    }

    return {
      totalBlocked: this.blockedIPs.size,
      totalWhitelisted: this.whitelistedIPs.size,
      activeBlocks,
      expiredBlocks,
      systemBlocks,
      adminBlocks
    };
  }
}
