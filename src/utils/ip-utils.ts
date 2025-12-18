import type { Context } from '@hono/hono';

/**
 * Extrait l'IP du client depuis le contexte de la requête
 * Vérifie plusieurs headers de proxy dans l'ordre de priorité
 * Normalise l'IP pour gérer les IPv4-mapped IPv6
 *
 * @param c - Contexte Hono
 * @returns L'adresse IP du client normalisée ou 'unknown' si non détectable
 */
export function getClientIP(c: Context): string {
  let rawIP: string | undefined;

  // 1. x-forwarded-for (proxy/load balancer)
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    // Prendre la première IP de la liste (client original)
    rawIP = forwarded.split(',')[0].trim();
  }

  // 2. x-real-ip (Nginx, Apache)
  if (!rawIP) {
    const realIP = c.req.header('x-real-ip');
    if (realIP) {
      rawIP = realIP.trim();
    }
  }

  // 3. cf-connecting-ip (Cloudflare)
  if (!rawIP) {
    const cfIP = c.req.header('cf-connecting-ip');
    if (cfIP) {
      rawIP = cfIP.trim();
    }
  }

  // 4. Adresse de connexion directe (Deno specific)
  if (!rawIP) {
    // @ts-ignore - Propriété Deno-specific
    const connInfo = c.env?.remoteAddr;
    if (connInfo?.hostname) {
      rawIP = connInfo.hostname;
    }
  }

  // Fallback si aucune IP détectable
  if (!rawIP) {
    return 'unknown';
  }

  // Normaliser l'IP (convertit ::ffff:x.x.x.x en x.x.x.x)
  return normalizeIP(rawIP);
}

/**
 * Valide le format d'une adresse IP (IPv4 ou IPv6)
 *
 * @param ip - L'adresse IP à valider
 * @returns true si l'IP est valide, false sinon
 */
export function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

  // IPv6 regex (simplifié)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  if (ipv4Regex.test(ip)) {
    // Valider que chaque octet est entre 0 et 255
    const octets = ip.split('.');
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  if (ipv6Regex.test(ip)) {
    return true;
  }

  return false;
}

/**
 * Normalise une adresse IP pour uniformiser le stockage
 *
 * - IPv4-mapped IPv6 : convertit en IPv4 pur (::ffff:192.168.1.1 → 192.168.1.1)
 * - IPv4 : retire les zéros initiaux (001.002.003.004 → 1.2.3.4)
 * - IPv6 : lowercase et retire le zone ID (fe80::1%eth0 → fe80::1)
 *
 * @param ip - L'adresse IP à normaliser
 * @returns L'IP normalisée
 */
export function normalizeIP(ip: string): string {
  if (!ip || typeof ip !== 'string') {
    return ip;
  }

  // Retirer le zone ID si présent (IPv6)
  const withoutZone = ip.split('%')[0];

  // Détecter et convertir IPv4-mapped IPv6 (::ffff:192.168.1.1)
  const ipv4MappedRegex = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;
  const match = withoutZone.match(ipv4MappedRegex);
  if (match) {
    // Extraire l'IPv4 et le normaliser
    const ipv4 = match[1];
    return ipv4
      .split('.')
      .map((octet) => parseInt(octet, 10).toString())
      .join('.');
  }

  // Détection IPv6 (contient ':' mais pas '.')
  if (withoutZone.includes(':') && !withoutZone.includes('.')) {
    // IPv6 : lowercase pour uniformité
    return withoutZone.toLowerCase();
  }

  // Détection IPv4
  if (withoutZone.includes('.')) {
    // IPv4 : retirer les zéros initiaux de chaque octet
    return withoutZone
      .split('.')
      .map((octet) => parseInt(octet, 10).toString())
      .join('.');
  }

  // Fallback : retourner tel quel
  return withoutZone;
}

/**
 * Convertit une adresse IP en notation CIDR pour PostgreSQL
 * Ajoute /32 pour IPv4 ou /128 pour IPv6
 *
 * @param ip - L'adresse IP normalisée
 * @returns L'IP en notation CIDR (ex: "192.168.1.1/32" ou "::1/128")
 */
export function ipToCIDR(ip: string): string {
  if (!ip || typeof ip !== 'string') {
    return ip;
  }

  // Si déjà en notation CIDR, retourner tel quel
  if (ip.includes('/')) {
    return ip;
  }

  // IPv6 (contient ':' mais pas '.')
  if (ip.includes(':') && !ip.includes('.')) {
    return `${ip}/128`;
  }

  // IPv4 (contient '.')
  if (ip.includes('.')) {
    return `${ip}/32`;
  }

  // Fallback
  return ip;
}

/**
 * Retire le suffixe CIDR d'une IP si présent
 * Convertit "192.168.1.1/32" en "192.168.1.1" ou "::1/128" en "::1"
 *
 * @param ip - L'adresse IP potentiellement avec CIDR
 * @returns L'IP sans le suffixe CIDR
 */
export function removeCIDRSuffix(ip: string): string {
  if (!ip || typeof ip !== 'string') {
    return ip;
  }

  // Si pas de '/', retourner tel quel
  if (!ip.includes('/')) {
    return ip;
  }

  // Retirer le suffixe /XX
  return ip.split('/')[0];
}
