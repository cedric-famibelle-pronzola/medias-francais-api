// deno-lint-ignore-file no-console
// Cache layer for data with TTL and stats

import {
  MediaEnrichi,
  OrganisationEnrichie,
  PersonneEnrichie
} from './index.ts';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  lastRefresh: string;
  cacheAge: number;
}

// Cache TTL in milliseconds (5 minutes default)
const CACHE_TTL = parseInt(Deno.env.get('CACHE_TTL') || '300000');

// Cache entries
let mediasCache: CacheEntry<MediaEnrichi[]> | null = null;
let personnesCache: CacheEntry<PersonneEnrichie[]> | null = null;
let organisationsCache: CacheEntry<OrganisationEnrichie[]> | null = null;

// Stats
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Load data from disk
 */
async function loadFromDisk<T>(path: string): Promise<T> {
  const data = await Deno.readTextFile(path);
  return JSON.parse(data);
}

/**
 * Check if cache is valid
 */
function isCacheValid<T>(cache: CacheEntry<T> | null): boolean {
  if (!cache) return false;

  const age = Date.now() - cache.timestamp;
  return age < CACHE_TTL;
}

/**
 * Get medias with cache
 */
export async function getCachedMedias(): Promise<MediaEnrichi[]> {
  if (isCacheValid(mediasCache)) {
    cacheHits++;
    mediasCache!.hits++;
    return mediasCache!.data;
  }

  cacheMisses++;
  const data = await loadFromDisk<MediaEnrichi[]>(
    'dist/enriched/medias.json'
  );

  mediasCache = {
    data,
    timestamp: Date.now(),
    hits: 0
  };

  return data;
}

/**
 * Get personnes with cache
 */
export async function getCachedPersonnes(): Promise<PersonneEnrichie[]> {
  if (isCacheValid(personnesCache)) {
    cacheHits++;
    personnesCache!.hits++;
    return personnesCache!.data;
  }

  cacheMisses++;
  const data = await loadFromDisk<PersonneEnrichie[]>(
    'dist/enriched/personnes.json'
  );

  personnesCache = {
    data,
    timestamp: Date.now(),
    hits: 0
  };

  return data;
}

/**
 * Get organisations with cache
 */
export async function getCachedOrganisations(): Promise<
  OrganisationEnrichie[]
> {
  if (isCacheValid(organisationsCache)) {
    cacheHits++;
    organisationsCache!.hits++;
    return organisationsCache!.data;
  }

  cacheMisses++;
  const data = await loadFromDisk<OrganisationEnrichie[]>(
    'dist/enriched/organisations.json'
  );

  organisationsCache = {
    data,
    timestamp: Date.now(),
    hits: 0
  };

  return data;
}

/**
 * Invalidate all caches (force reload on next access)
 */
export function invalidateCache(): void {
  mediasCache = null;
  personnesCache = null;
  organisationsCache = null;
  console.log('[Cache] All caches invalidated');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const now = Date.now();
  let lastRefresh = 'Never';
  let cacheAge = 0;

  if (mediasCache) {
    lastRefresh = new Date(mediasCache.timestamp).toISOString();
    cacheAge = now - mediasCache.timestamp;
  }

  return {
    hits: cacheHits,
    misses: cacheMisses,
    lastRefresh,
    cacheAge
  };
}

/**
 * Warmup cache (preload all data)
 */
export async function warmupCache(): Promise<void> {
  console.log('[Cache] Warming up cache...');
  await Promise.all([
    getCachedMedias(),
    getCachedPersonnes(),
    getCachedOrganisations()
  ]);
  console.log('[Cache] Cache warmed up successfully');
}
