import type {
  BlockedIP,
  IPBlockingStats,
  WhitelistedIP
} from '../../@types/blocked-ip.ts';

/**
 * Interface commune pour les adapters de stockage du système de blocage d'IP
 *
 * Les implémentations doivent supporter :
 * - DuckDB (fichier local)
 * - PostgreSQL (base de données distante)
 * - Memory (en mémoire, pour tests)
 */
export interface IPBlockingAdapter {
  /**
   * Initialise la connexion au système de stockage
   * Crée les tables si elles n'existent pas
   *
   * @throws Error si l'initialisation échoue
   */
  initialize(): Promise<void>;

  /**
   * Ferme la connexion au système de stockage
   * Libère les ressources (pool de connexions, etc.)
   */
  close(): Promise<void>;

  /**
   * Vérifie que la connexion au stockage est fonctionnelle
   *
   * @returns true si la connexion fonctionne, false sinon
   */
  healthCheck(): Promise<boolean>;

  // === Opérations de blocage ===

  /**
   * Bloque une IP ou met à jour un blocage existant
   *
   * Si l'IP est déjà bloquée, les informations sont mises à jour (upsert)
   *
   * @param block - Les informations du blocage
   */
  blockIP(block: BlockedIP): Promise<void>;

  /**
   * Débloque une IP (retire du blocklist)
   *
   * @param ip - L'adresse IP à débloquer
   * @returns true si l'IP était bloquée et a été débloquée, false si elle n'était pas bloquée
   */
  unblockIP(ip: string): Promise<boolean>;

  /**
   * Vérifie si une IP est bloquée
   *
   * Retourne les détails du blocage si l'IP est bloquée et le blocage n'est pas expiré.
   * Vérifie automatiquement la whitelist (une IP whitelistée retourne null même si bloquée).
   *
   * @param ip - L'adresse IP à vérifier
   * @returns Les informations du blocage si bloquée, null sinon
   */
  isBlocked(ip: string): Promise<BlockedIP | null>;

  /**
   * Récupère la liste des IP bloquées
   *
   * @param includeExpired - Si true, inclut les blocages expirés (défaut: false)
   * @returns La liste des IP bloquées
   */
  getBlockedIPs(includeExpired?: boolean): Promise<BlockedIP[]>;

  // === Opérations de whitelist ===

  /**
   * Ajoute une IP à la whitelist
   *
   * Les IP whitelistées ne peuvent jamais être bloquées
   *
   * @param whitelist - Les informations de whitelist
   */
  addToWhitelist(whitelist: WhitelistedIP): Promise<void>;

  /**
   * Retire une IP de la whitelist
   *
   * @param ip - L'adresse IP à retirer
   * @returns true si l'IP était whitelistée et a été retirée, false si elle n'était pas whitelistée
   */
  removeFromWhitelist(ip: string): Promise<boolean>;

  /**
   * Vérifie si une IP est dans la whitelist
   *
   * @param ip - L'adresse IP à vérifier
   * @returns true si whitelistée, false sinon
   */
  isWhitelisted(ip: string): Promise<boolean>;

  /**
   * Récupère la liste des IP whitelistées
   *
   * @returns La liste des IP whitelistées
   */
  getWhitelistedIPs(): Promise<WhitelistedIP[]>;

  // === Maintenance ===

  /**
   * Nettoie les blocages expirés de la base de données
   *
   * @returns Le nombre de blocages supprimés
   */
  cleanupExpiredBlocks(): Promise<number>;

  /**
   * Récupère les statistiques du système de blocage
   *
   * @returns Les statistiques (total bloqués, actifs, whitelist, etc.)
   */
  getStats(): Promise<IPBlockingStats>;
}
