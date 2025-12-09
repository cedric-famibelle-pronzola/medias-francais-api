import type { LogEntry } from '../../@types/log-entry.ts';

/**
 * Interface commune pour les adapters de stockage de logs
 */
export interface LogAdapter {
  /**
   * Initialise la connexion au système de stockage
   */
  initialize(): Promise<void>;

  /**
   * Insère un log dans le système de stockage
   */
  insertLog(log: LogEntry): Promise<void>;

  /**
   * Ferme la connexion au système de stockage
   */
  close(): Promise<void>;

  /**
   * Vérifie que la connexion est fonctionnelle
   */
  healthCheck(): Promise<boolean>;
}
