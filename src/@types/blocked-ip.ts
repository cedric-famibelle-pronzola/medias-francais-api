/**
 * Interfaces pour le système de blocage d'IP
 */

export interface BlockedIP {
  /** L'IP cible qui est bloquée */
  ip: string;

  /** Raison du blocage */
  reason: string;

  /** Date à laquelle l'IP a été bloquée */
  blockedAt: Date;

  /**
   * Date d'expiration du blocage
   * - undefined ou null = blocage permanent
   * - Date future = blocage temporaire
   */
  expiresAt?: Date | null;

  /**
   * Source du blocage
   * - 'system' : Blocage automatique (rate-limiter, etc.)
   * - 'admin' : Blocage manuel via API admin
   */
  source: 'system' | 'admin';

  /**
   * Informations sur qui a effectué le blocage
   * Présent uniquement pour les blocages 'admin'
   */
  blockedBy?: {
    /** IP de l'administrateur qui a effectué le blocage (auto-détectée) */
    ip: string;

    /** Identifiant optionnel de l'admin (email, nom, etc.) */
    identifier?: string;
  };

  /**
   * Métadonnées additionnelles
   */
  metadata?: {
    /** User-Agent lors du blocage */
    userAgent?: string;

    /** Endpoint qui a déclenché le blocage */
    endpoint?: string;

    /** Nombre de requêtes/violations */
    requestCount?: number;

    /** Autres données */
    [key: string]: unknown;
  };
}

export interface WhitelistedIP {
  /** L'IP qui est dans la whitelist */
  ip: string;

  /** Date d'ajout à la whitelist */
  addedAt: Date;

  /**
   * Informations sur qui a ajouté l'IP à la whitelist
   */
  addedBy?: {
    /** IP de l'administrateur (auto-détectée) */
    ip: string;

    /** Identifiant optionnel */
    identifier?: string;
  };

  /** Raison de l'ajout à la whitelist */
  reason?: string;
}

export interface BlockIPRequest {
  /** IP à bloquer */
  ip: string;

  /** Raison du blocage */
  reason: string;

  /** Durée du blocage en minutes (undefined = permanent) */
  duration?: number;

  /** Identifiant de l'admin effectuant le blocage */
  identifier?: string;

  /** Métadonnées additionnelles */
  metadata?: Record<string, unknown>;
}

export interface IPBlockingStats {
  /** Nombre total d'IP bloquées (actives + expirées) */
  totalBlocked: number;

  /** Nombre total d'IP dans la whitelist */
  totalWhitelisted: number;

  /** Nombre d'IP actuellement bloquées (non expirées) */
  activeBlocks: number;

  /** Nombre d'IP avec blocage expiré */
  expiredBlocks: number;

  /** Nombre de blocages système */
  systemBlocks: number;

  /** Nombre de blocages admin */
  adminBlocks: number;
}
