# Système de logging structuré

L'API dispose d'un système de logging structuré avec support multi-backend (DuckDB ou PostgreSQL) pour enregistrer toutes les requêtes HTTP.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Configuration](#configuration)
- [Backends disponibles](#backends-disponibles)
- [Logs collectés](#logs-collectés)
- [Environnements](#environnements)
- [Confidentialité](#confidentialité)

## Vue d'ensemble

Le système de logging permet de :
- **Sécurité** : Détecter les abus, attaques DDoS, tentatives d'intrusion
- **Performance** : Analyser les temps de réponse et optimiser l'infrastructure
- **Fiabilité** : Diagnostiquer les erreurs et améliorer la qualité du service
- **Statistiques** : Comprendre l'usage de l'API pour son amélioration

### Architecture

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  structuredLogger   │ ← Middleware Hono
│    (middleware)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   log-storage.ts    │ ← Factory (auto-détection)
│     (factory)       │
└──────┬──────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│   DuckDB    │   │  PostgreSQL  │
│   Adapter   │   │   Adapter    │
└─────────────┘   └──────────────┘
```

## Configuration

### Variables d'environnement

#### `.env` (développement local et production auto-hébergée)

```bash
# Activer les logs structurés (désactivé par défaut en dev)
USE_STRUCTURED_LOGGER=true

# Backend de stockage (auto, duckdb, postgres)
LOG_STORAGE_BACKEND=auto

# URL de connexion PostgreSQL (si backend=postgres)
DATABASE_URL=postgresql://user:password@host:5432/database
```

#### Deno Deploy

Sur Deno Deploy, configurez les variables d'environnement dans le dashboard :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `ENVIRONMENT` | `production` | Active automatiquement le logger structuré |
| `LOG_STORAGE_BACKEND` | `postgres` | ⚠️ **Obligatoire** (DuckDB non supporté sur Deno Deploy) |
| `DATABASE_URL` | `postgresql://...` | URL de connexion PostgreSQL |

⚠️ **Important** : DuckDB nécessite un système de fichiers persistant en écriture et n'est **pas compatible avec Deno Deploy** (environnement serverless sans persistance de fichiers). Utilisez **obligatoirement PostgreSQL** en production serverless.

## Backends disponibles

### DuckDB (développement local uniquement)

**Caractéristiques :**
- ✅ Aucune configuration requise
- ✅ Fichier local `logs/access_logs.db`
- ✅ Parfait pour le développement
- ❌ **Non compatible Deno Deploy** (nécessite système de fichiers persistant en écriture)
- ❌ Non distribué (un fichier = une instance)

**Activation automatique :**
```bash
# .env
USE_STRUCTURED_LOGGER=true
# LOG_STORAGE_BACKEND=auto (par défaut, choisit DuckDB si pas de DATABASE_URL)
```

**Structure de stockage :**
```sql
CREATE TABLE logs (
  log JSON  -- Toutes les données en JSON
)
```

**Lecture des logs (CLI DuckDB) :**
```bash
duckdb logs/access_logs.db

# Requêtes SQL
SELECT * FROM logs LIMIT 10;

# Extraire des champs JSON
SELECT
  json_extract(log, '$.timestamp') as timestamp,
  json_extract(log, '$.method') as method,
  json_extract(log, '$.path') as path,
  json_extract(log, '$.status') as status,
  json_extract(log, '$.ip') as ip
FROM logs
WHERE json_extract(log, '$.status') >= 400
ORDER BY json_extract(log, '$.timestamp') DESC;
```

### PostgreSQL (local et production)

**Caractéristiques :**
- ✅ Compatible Deno Deploy
- ✅ Distribué (plusieurs instances = même base)
- ✅ Requêtes SQL performantes (index)
- ✅ Sauvegarde et réplication natives
- ⚠️ Nécessite une instance PostgreSQL

**Activation :**
```bash
# .env
USE_STRUCTURED_LOGGER=true
LOG_STORAGE_BACKEND=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/medias_francais
```

**Structure de la table :**
```sql
CREATE TABLE logs (
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
);

-- Index pour performances
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_status ON logs(status);
CREATE INDEX idx_logs_path ON logs(path);
CREATE INDEX idx_logs_request_id ON logs(request_id);
```

**Lecture des logs (SQL) :**
```sql
-- Derniers logs
SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10;

-- Erreurs 5xx des dernières 24h
SELECT * FROM logs
WHERE status >= 500
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Top 10 des endpoints les plus lents
SELECT path, AVG(duration) as avg_ms, COUNT(*) as requests
FROM logs
GROUP BY path
ORDER BY avg_ms DESC
LIMIT 10;

-- Requêtes par IP (détection abus)
SELECT ip, COUNT(*) as requests
FROM logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ip
ORDER BY requests DESC
LIMIT 20;
```

## Logs collectés

Chaque requête HTTP génère une entrée de log contenant :

```typescript
{
  timestamp: string;      // ISO 8601 UTC (ex: "2025-12-09T10:30:15.234Z")
  level: string;          // "info" | "warn" | "error"
  method: string;         // "GET", "POST", etc.
  path: string;           // "/medias", "/personnes/search"
  query: string;          // "?type=Télévision&limit=20"
  status: number;         // 200, 404, 500, etc.
  duration: number;       // Temps de traitement en ms
  ip: string;             // Adresse IP du client
  userAgent: string;      // User-Agent complet
  requestId: string;      // ID unique de la requête (8 caractères)
  referer?: string;       // URL d'origine (optionnel)
}
```

**Exemple de log :**
```json
{
  "timestamp": "2025-12-09T10:30:15.234Z",
  "level": "info",
  "method": "GET",
  "path": "/medias",
  "query": "?type=Télévision&limit=20",
  "status": 200,
  "duration": 45,
  "ip": "203.0.113.42",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "requestId": "3a8f2c1d",
  "referer": "https://example.com/search"
}
```

## Environnements

### Développement local

**Par défaut** : Logger Hono standard (console simple)
```bash
# .env
USE_STRUCTURED_LOGGER=false  # ou absent
```

**Avec logs structurés + DuckDB** :
```bash
# .env
USE_STRUCTURED_LOGGER=true
# LOG_STORAGE_BACKEND=auto (DuckDB par défaut)
```

**Avantages DuckDB en local :**
- Aucune dépendance externe
- Fichier local simple à explorer
- Idéal pour déboguer

### Production auto-hébergée (VPS, serveur dédié)

**Option 1 : DuckDB** (simple, pas de dépendance)
```bash
# .env
ENVIRONMENT=production
# LOG_STORAGE_BACKEND=auto (DuckDB si pas de DATABASE_URL)
```

**Option 2 : PostgreSQL** (recommandé pour multi-instances)
```bash
# .env
ENVIRONMENT=production
LOG_STORAGE_BACKEND=postgres
DATABASE_URL=postgresql://user:password@postgres-host:5432/logs
```

### Production Deno Deploy

⚠️ **Configuration obligatoire** : PostgreSQL uniquement

**Variables d'environnement Deno Deploy :**
```
ENVIRONMENT=production
LOG_STORAGE_BACKEND=postgres
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Services PostgreSQL compatibles :**
- [Neon](https://neon.tech/) - PostgreSQL serverless
- [Supabase](https://supabase.com/) - PostgreSQL + API
- [Railway](https://railway.app/) - PostgreSQL managé
- [Render](https://render.com/) - PostgreSQL managé
- Amazon RDS PostgreSQL
- Google Cloud SQL PostgreSQL

**⚠️ Limitations Deno Deploy :**
- ❌ Pas de système de fichiers persistant en écriture → **DuckDB impossible**
- ✅ FFI supporté depuis 2025, mais inutile sans persistance de fichiers
- ✅ Connexions réseau autorisées → **PostgreSQL OK**
- ℹ️ Pour la persistance : Utiliser PostgreSQL ou [Deno KV](https://docs.deno.com/deploy/kv/)

## Confidentialité

Les logs collectent des données personnelles (IP, User-Agent). Consultez [PRIVACY.md](../PRIVACY.md) pour :
- Justification légale (RGPD)
- Durée de conservation (6 mois)
- Droits des utilisateurs
- Transferts internationaux (Deno Deploy)

## Requêtes d'analyse utiles

### PostgreSQL

```sql
-- Statistiques par jour
SELECT
  DATE(timestamp) as date,
  COUNT(*) as requests,
  AVG(duration) as avg_duration_ms,
  COUNT(*) FILTER (WHERE status >= 500) as errors_5xx,
  COUNT(*) FILTER (WHERE status >= 400 AND status < 500) as errors_4xx
FROM logs
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Top 10 User-Agents
SELECT
  user_agent,
  COUNT(*) as requests
FROM logs
GROUP BY user_agent
ORDER BY requests DESC
LIMIT 10;

-- Endpoints les plus utilisés
SELECT
  path,
  COUNT(*) as requests,
  AVG(duration) as avg_ms,
  MAX(duration) as max_ms
FROM logs
GROUP BY path
ORDER BY requests DESC;

-- Requêtes lentes (>1 seconde)
SELECT
  timestamp,
  method,
  path,
  duration,
  ip
FROM logs
WHERE duration > 1000
ORDER BY duration DESC;
```

### DuckDB

```sql
-- Même requêtes mais extraction JSON
SELECT
  DATE(json_extract(log, '$.timestamp')::TIMESTAMP) as date,
  COUNT(*) as requests,
  AVG(json_extract(log, '$.duration')::INTEGER) as avg_duration_ms
FROM logs
GROUP BY DATE(json_extract(log, '$.timestamp')::TIMESTAMP)
ORDER BY date DESC;
```

## Troubleshooting

### Logs non sauvegardés (DuckDB)

**Problème** : `Failed to insert log: IO Error: Could not set lock`

**Cause** : Fichier DuckDB ouvert dans le CLI

**Solution** : Fermez le CLI DuckDB avant de lancer le serveur

### Logs non sauvegardés (PostgreSQL)

**Problème** : `PostgreSQL pool not initialized`

**Vérifications** :
1. `DATABASE_URL` est bien définie
2. PostgreSQL est accessible depuis l'application
3. Table `logs` existe (créée automatiquement au démarrage)

**Test de connexion** :
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Sur Deno Deploy : pas de logs en base

**Cause probable** : `LOG_STORAGE_BACKEND` n'est pas défini ou = `auto` sans `DATABASE_URL`

**Solution** : Définir explicitement dans le dashboard Deno Deploy :
```
LOG_STORAGE_BACKEND=postgres
DATABASE_URL=postgresql://...
```

## Désactiver les logs structurés

Pour revenir au logger simple (console) :

```bash
# .env
USE_STRUCTURED_LOGGER=false
# ou supprimer la variable
```

Le logger Hono standard sera utilisé (output console coloré, non structuré).
