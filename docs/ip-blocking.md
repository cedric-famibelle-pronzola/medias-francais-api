# Système de Blocage d'IP

Le système de blocage d'IP permet de contrôler l'accès à l'API en bloquant ou en
autorisant des adresses IP spécifiques.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Blocage automatique](#blocage-automatique)
- [API d'administration](#api-dadministration)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Stockage des données](#stockage-des-données)

---

## Vue d'ensemble

Le système de blocage d'IP offre :

- **Blocage manuel** : Via l'API d'administration
- **Blocage automatique** : Après violations répétées du rate limiter
- **Whitelist** : Liste d'IPs qui ne peuvent jamais être bloquées
- **Blocages temporaires ou permanents** : Avec ou sans date d'expiration
- **Multi-backend** : Stockage en mémoire, DuckDB ou PostgreSQL
- **Protection fail-open** : Autorise les requêtes si la DB est indisponible
  (configurable)

### Flux de traitement

```
Requête entrante
    ↓
Détection IP (x-forwarded-for, x-real-ip, cf-connecting-ip)
    ↓
Vérification whitelist → Si dans whitelist: ✅ Autorisé
    ↓
Vérification blocklist → Si bloqué: ❌ 403 Forbidden
    ↓
Rate limiter → Si violations > seuil: 🔒 Blocage automatique
    ↓
Traitement normal de la requête
```

---

## Architecture

### Composants

```
src/
├── @types/
│   └── blocked-ip.ts              # Types TypeScript
├── utils/
│   └── ip-utils.ts                # Utilitaires IP (détection, validation)
├── db/
│   ├── adapters/
│   │   ├── ip-blocking-adapter.interface.ts   # Interface
│   │   ├── ip-blocking-memory-adapter.ts      # Adapter mémoire
│   │   ├── ip-blocking-duckdb-adapter.ts      # Adapter DuckDB
│   │   └── ip-blocking-postgres-adapter.ts    # Adapter PostgreSQL
│   └── ip-blocking-storage.ts     # Factory singleton
├── middlewares/
│   └── ip-blocking.ts             # Middleware de vérification
└── routers/
    └── admin.router.ts            # API d'administration
```

### Adapters de stockage

- **Memory** : En mémoire (développement/tests)
- **DuckDB** : Fichier local `logs/ip_blocking.db` (mono-instance)
- **PostgreSQL** : Base de données (production multi-instances)

---

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```bash
# === IP Blocking Configuration ===

# Backend de stockage (auto, duckdb, postgres, memory)
# auto = postgres si IP_BLOCKING_DATABASE_URL existe, sinon duckdb
IP_BLOCKING_STORAGE=auto

# URL PostgreSQL pour le blocage d'IP (optionnel)
# Si non définie, utilise DATABASE_URL comme fallback
# Permet d'utiliser une base de données séparée
IP_BLOCKING_DATABASE_URL=postgresql://user:password@host:5432/ip_blocking_db

# Whitelist d'IPs (format CSV)
# Ces IPs sont chargées automatiquement au démarrage
IP_BLOCKING_WHITELIST=127.0.0.1,::1

# Stratégie en cas d'erreur de base de données
# false (défaut) = fail-open (autoriser si DB indisponible)
# true = fail-closed (bloquer si DB indisponible)
IP_BLOCKING_FAIL_CLOSED=false

# === Auto-blocking depuis le rate-limiter ===

# Activer le blocage automatique
AUTO_BLOCK_ENABLED=false

# Nombre de violations avant auto-blocage
AUTO_BLOCK_THRESHOLD=10

# Durée du blocage automatique en minutes
AUTO_BLOCK_DURATION=60
```

### Configuration PostgreSQL

Si vous utilisez PostgreSQL, les tables sont créées automatiquement :

```sql
-- Table des IPs bloquées
CREATE TABLE blocked_ips (
  ip CIDR NOT NULL PRIMARY KEY,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  source VARCHAR(10) NOT NULL CHECK (source IN ('system', 'admin')),
  blocked_by_ip CIDR,
  blocked_by_identifier VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des IPs en whitelist
CREATE TABLE whitelisted_ips (
  ip CIDR NOT NULL PRIMARY KEY,
  added_at TIMESTAMPTZ NOT NULL,
  added_by_ip CIDR,
  added_by_identifier VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser le nettoyage
CREATE INDEX idx_blocked_ips_expires_at
ON blocked_ips(expires_at)
WHERE expires_at IS NOT NULL;
```

---

## Blocage automatique

Le système peut bloquer automatiquement les IPs qui violent répétitivement le
rate limiter.

### Fonctionnement

1. Une IP dépasse le rate limit
2. Le compteur de violations s'incrémente
3. Si `violations >= AUTO_BLOCK_THRESHOLD` :
   - Vérification de la whitelist
   - Si pas en whitelist → Blocage automatique temporaire
   - Source = `system`, durée = `AUTO_BLOCK_DURATION` minutes

### Exemple de configuration

```bash
# Bloquer automatiquement après 10 violations
AUTO_BLOCK_ENABLED=true
AUTO_BLOCK_THRESHOLD=10
AUTO_BLOCK_DURATION=60  # 1 heure
```

### Métadonnées enregistrées

Lors d'un blocage automatique :

```json
{
  "violations": 12,
  "endpoint": "/api/search",
  "userAgent": "Mozilla/5.0..."
}
```

---

## API d'administration

Toutes les routes admin nécessitent l'en-tête `X-Admin-Key` (en production).

### Authentification

```bash
X-Admin-Key: votre-clé-admin
```

Configurez la clé dans `.env` :

```bash
ADMIN_KEY=votre-cle-secrete
```

### Endpoints

#### 1. Bloquer une IP

```http
POST /admin/ip-blocking/block
Content-Type: application/json
X-Admin-Key: votre-clé-admin

{
  "ip": "192.168.1.100",
  "reason": "Tentatives de spam répétées",
  "duration": 1440,
  "identifier": "admin@example.com",
  "metadata": {
    "ticket": "SEC-1234"
  }
}
```

**Paramètres** :

- `ip` (requis) : Adresse IP à bloquer
- `reason` (requis) : Raison du blocage
- `duration` (optionnel) : Durée en minutes (permanent si omis)
- `identifier` (optionnel) : Email ou nom de l'admin
- `metadata` (optionnel) : Métadonnées additionnelles

**Réponse** :

```json
{
  "success": true,
  "blocked": {
    "ip": "192.168.1.100",
    "reason": "Tentatives de spam répétées",
    "blockedAt": "2024-12-18T10:30:00.000Z",
    "expiresAt": "2024-12-19T10:30:00.000Z",
    "source": "admin",
    "blockedBy": {
      "ip": "192.168.1.1",
      "identifier": "admin@example.com"
    }
  }
}
```

#### 2. Débloquer une IP

```http
DELETE /admin/ip-blocking/unblock/192.168.1.100
X-Admin-Key: votre-clé-admin
```

**Réponse** :

```json
{
  "success": true,
  "message": "IP 192.168.1.100 has been unblocked"
}
```

#### 3. Lister les IPs bloquées

```http
GET /admin/ip-blocking/list?includeExpired=true
X-Admin-Key: votre-clé-admin
```

**Paramètres** :

- `includeExpired` (optionnel) : Inclure les blocages expirés (défaut: false)

**Réponse** :

```json
{
  "success": true,
  "blockedIPs": [
    {
      "ip": "192.168.1.100",
      "reason": "Tentatives de spam répétées",
      "blockedAt": "2024-12-18T10:30:00.000Z",
      "expiresAt": "2024-12-19T10:30:00.000Z",
      "source": "admin",
      "blockedBy": {
        "ip": "192.168.1.1",
        "identifier": "admin@example.com"
      }
    }
  ],
  "total": 1
}
```

#### 4. Ajouter à la whitelist

```http
POST /admin/ip-blocking/whitelist/add
Content-Type: application/json
X-Admin-Key: votre-clé-admin

{
  "ip": "203.0.113.50",
  "reason": "IP de monitoring",
  "identifier": "admin@example.com"
}
```

**Réponse** :

```json
{
  "success": true,
  "whitelisted": {
    "ip": "203.0.113.50",
    "addedAt": "2024-12-18T10:30:00.000Z",
    "addedBy": {
      "ip": "192.168.1.1",
      "identifier": "admin@example.com"
    },
    "reason": "IP de monitoring"
  }
}
```

#### 5. Retirer de la whitelist

```http
DELETE /admin/ip-blocking/whitelist/remove/203.0.113.50
X-Admin-Key: votre-clé-admin
```

#### 6. Lister la whitelist

```http
GET /admin/ip-blocking/whitelist
X-Admin-Key: votre-clé-admin
```

#### 7. Nettoyer les blocages expirés

```http
POST /admin/ip-blocking/cleanup
X-Admin-Key: votre-clé-admin
```

**Réponse** :

```json
{
  "success": true,
  "cleaned": 5,
  "message": "Cleaned up 5 expired blocks"
}
```

#### 8. Statistiques

```http
GET /admin/ip-blocking/stats
X-Admin-Key: votre-clé-admin
```

**Réponse** :

```json
{
  "success": true,
  "stats": {
    "totalBlocked": 15,
    "totalWhitelisted": 3,
    "activeBlocks": 10,
    "expiredBlocks": 5,
    "systemBlocks": 8,
    "adminBlocks": 7
  }
}
```

#### 9. Vérifier une IP

```http
GET /admin/ip-blocking/check/192.168.1.100
X-Admin-Key: votre-clé-admin
```

**Réponse (bloquée)** :

```json
{
  "success": true,
  "ip": "192.168.1.100",
  "blocked": true,
  "blockInfo": {
    "reason": "Auto-block: 12 rate-limit violations",
    "blockedAt": "2024-12-18T10:30:00.000Z",
    "expiresAt": "2024-12-18T11:30:00.000Z",
    "source": "system"
  }
}
```

**Réponse (non bloquée)** :

```json
{
  "success": true,
  "ip": "192.168.1.100",
  "blocked": false
}
```

---

## Exemples d'utilisation

### Bloquer une IP pendant 24h

```bash
curl -X POST http://localhost:8000/admin/ip-blocking/block \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: votre-clé" \
  -d '{
    "ip": "203.0.113.100",
    "reason": "Activité suspecte détectée",
    "duration": 1440
  }'
```

### Bloquer définitivement

```bash
curl -X POST http://localhost:8000/admin/ip-blocking/block \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: votre-clé" \
  -d '{
    "ip": "203.0.113.200",
    "reason": "Abus confirmé - blocage permanent"
  }'
```

### Ajouter une IP de confiance

```bash
curl -X POST http://localhost:8000/admin/ip-blocking/whitelist/add \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: votre-clé" \
  -d '{
    "ip": "203.0.113.50",
    "reason": "Serveur de monitoring UptimeRobot"
  }'
```

### Vérifier le statut d'une IP

```bash
curl http://localhost:8000/admin/ip-blocking/check/203.0.113.100 \
  -H "X-Admin-Key: votre-clé"
```

### Obtenir les statistiques

```bash
curl http://localhost:8000/admin/ip-blocking/stats \
  -H "X-Admin-Key: votre-clé"
```

---

## Stockage des données

### Memory Adapter

**Utilisation** : Développement, tests

**Avantages** :

- Aucune dépendance externe
- Performances maximales
- Idéal pour les tests

**Inconvénients** :

- Données perdues au redémarrage
- Limité à une instance

**Configuration** :

```bash
IP_BLOCKING_STORAGE=memory
```

### DuckDB Adapter

**Utilisation** : Mono-instance, développement local

**Avantages** :

- Fichier local simple
- Aucun serveur de base de données requis
- Performances excellentes

**Inconvénients** :

- Partiel : lectures non implémentées (à compléter)
- Ne fonctionne pas en multi-instances

**Configuration** :

```bash
IP_BLOCKING_STORAGE=duckdb
```

**Fichier** : `logs/ip_blocking.db` (créé automatiquement)

### PostgreSQL Adapter

**Utilisation** : Production, multi-instances

**Avantages** :

- Production-ready
- Fonctionne avec plusieurs instances
- ACID compliant
- Types CIDR natifs pour validation

**Inconvénients** :

- Nécessite un serveur PostgreSQL

**Configuration** :

```bash
IP_BLOCKING_STORAGE=postgres
IP_BLOCKING_DATABASE_URL=postgresql://user:password@host:5432/db
```

### Mode Auto

Le mode `auto` sélectionne automatiquement :

- **PostgreSQL** si `IP_BLOCKING_DATABASE_URL` ou `DATABASE_URL` existe
- **DuckDB** sinon

```bash
IP_BLOCKING_STORAGE=auto  # Défaut
```

---

## Gestion des erreurs

### Réponse de blocage

Quand une IP est bloquée, l'API retourne :

**Status** : `403 Forbidden`

**Headers** :

```
Retry-After: 3600  # Secondes restantes (si blocage temporaire)
```

**Body** :

```json
{
  "error": {
    "id": "abc123de",
    "code": "IP_BLOCKED",
    "message": "Access denied: Your IP address (203.0.113.100) has been blocked",
    "details": {
      "reason": "Auto-block: 12 rate-limit violations",
      "source": "system",
      "expiresAt": "2024-12-18T11:30:00.000Z"
    }
  }
}
```

### Stratégies de résilience

#### Fail-open (défaut)

En cas d'erreur de base de données, les requêtes sont **autorisées** :

```bash
IP_BLOCKING_FAIL_CLOSED=false
```

**Log** :

```
[IPBlocking] DB error for IP 203.0.113.100, allowing request (fail-open)
```

#### Fail-closed

En cas d'erreur de base de données, les requêtes sont **bloquées** :

```bash
IP_BLOCKING_FAIL_CLOSED=true
```

**Réponse** :

```json
{
  "error": {
    "code": "IP_BLOCKED",
    "message": "Access temporarily unavailable",
    "details": {
      "reason": "System temporarily unavailable",
      "source": "system",
      "expiresAt": null
    }
  }
}
```

---

## Monitoring et maintenance

### Logs

Les actions importantes sont journalisées :

```
[IPBlocking] IP 203.0.113.100 is blocked (system): Auto-block: 12 rate-limit violations
[RateLimiter] Auto-blocked IP 203.0.113.100 after 12 violations
[IPBlocking] IP 203.0.113.50 reached threshold but is whitelisted
```

### Nettoyage automatique

Les blocages expirés sont nettoyés de manière lazy :

- Lors de la vérification (`isBlocked`)
- Via l'endpoint `/admin/ip-blocking/cleanup`

### Commandes utiles

```bash
# Vérifier les statistiques
curl -H "X-Admin-Key: votre-clé" \
  http://localhost:8000/admin/ip-blocking/stats

# Nettoyer les blocages expirés
curl -X POST -H "X-Admin-Key: votre-clé" \
  http://localhost:8000/admin/ip-blocking/cleanup

# Lister tous les blocages actifs
curl -H "X-Admin-Key: votre-clé" \
  http://localhost:8000/admin/ip-blocking/list
```

---

## Sécurité

### Protection de l'API admin

En production, **toujours** définir `ADMIN_KEY` :

```bash
ADMIN_KEY=$(openssl rand -hex 32)
```

### Détection d'IP

Ordre de priorité :

1. `x-forwarded-for` (premier IP de la liste)
2. `x-real-ip`
3. `cf-connecting-ip` (Cloudflare)
4. IP de connexion directe

### Protection anti-self-block

L'API empêche un admin de bloquer sa propre IP :

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Cannot block your own IP address",
    "details": {
      "requestedIP": "192.168.1.1",
      "yourIP": "192.168.1.1"
    }
  }
}
```

### Whitelist prioritaire

Les IPs en whitelist ne peuvent **jamais** être bloquées, même manuellement.

---

## Limitations

### IPs supportées

- **IPv4** : Oui
- **IPv6** : Oui
- **CIDR ranges** : Non (une seule IP à la fois)

### DuckDB

L'adapter DuckDB est partiellement implémenté :

- ✅ Écriture (INSERT, DELETE)
- ❌ Lecture (SELECT) - à implémenter

Utilisez PostgreSQL ou Memory pour un support complet.

---

## FAQ

### Comment bloquer un range d'IPs ?

Le système ne supporte actuellement que les IPs individuelles. Pour bloquer un
range, bloquez chaque IP séparément via script.

### Les blocages survivent-ils au redémarrage ?

- **Memory** : Non
- **DuckDB** : Oui
- **PostgreSQL** : Oui

### Peut-on utiliser deux bases de données différentes ?

Oui, définissez `IP_BLOCKING_DATABASE_URL` pour le blocage d'IP et
`DATABASE_URL` pour les logs.

### Que se passe-t-il si PostgreSQL est down ?

Selon la configuration :

- `IP_BLOCKING_FAIL_CLOSED=false` → Requêtes autorisées (défaut)
- `IP_BLOCKING_FAIL_CLOSED=true` → Requêtes bloquées

### Comment désactiver l'auto-blocage ?

```bash
AUTO_BLOCK_ENABLED=false
```

---

## Voir aussi

- [Rate Limiting](../README.md#rate-limiting)
- [Système de logging](logging.md)
- [API Endpoints](api-endpoints.md)
- [Déploiement](deploy.md)
