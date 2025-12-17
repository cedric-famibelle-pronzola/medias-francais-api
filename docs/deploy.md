# Guide de Déploiement

Guide complet pour déployer l'API medias-francais-api dans différents
environnements.

## 📋 Table des Matières

1. [Environnements de Déploiement](#environnements-de-déploiement)
2. [Développement Local](#développement-local)
3. [Production Auto-hébergée (VPS)](#production-auto-hébergée-vps)
4. [Deno Deploy (Serverless)](#deno-deploy-serverless)
5. [Variables d'Environnement](#variables-denvironnement)
6. [Commandes de Build](#commandes-de-build)
7. [Monitoring et Logs](#monitoring-et-logs)
8. [Troubleshooting](#troubleshooting)

---

## Environnements de Déploiement

L'API supporte trois environnements :

| Environnement   | Usage                    | Logging Backend      | Hébergement                   |
| --------------- | ------------------------ | -------------------- | ----------------------------- |
| **Local**       | Développement            | Console ou DuckDB    | Machine locale                |
| **VPS**         | Production auto-hébergée | DuckDB ou PostgreSQL | VPS (DigitalOcean, OVH, etc.) |
| **Deno Deploy** | Production serverless    | PostgreSQL           | Deno Deploy (edge)            |

---

## Développement Local

### Prérequis

- [Deno](https://deno.com/) 2.5.6 ou supérieur
- (Optionnel) PostgreSQL pour logs structurés

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/cedric-famibelle-pronzola/medias-francais-api.git
cd medias-francais-api

# Copier le fichier d'environnement
cp .env.sample .env

# Installer les dépendances
deno install
```

### Configuration (.env)

```bash
# Environnement
ENVIRONMENT=development

# Port
API_PORT=8000

# Logging (optionnel en dev)
USE_STRUCTURED_LOGGER=false

# Source des données GitHub
GH_SOURCE=https://raw.githubusercontent.com/mdiplo/Medias_francais/master/
```

### Build et Démarrage

```bash
# 1. Télécharger et convertir les données TSV → JSON
deno task build

# 2. Enrichir les données avec les chaînes de propriété
deno task enrich

# 3. Démarrer le serveur en mode développement (watch mode)
deno task dev
```

L'API sera accessible sur http://localhost:8000

### Tests

```bash
# Exécuter tous les tests
deno task test

# Linter
deno task lint

# Formatter
deno task fmt
```

---

## Production Auto-hébergée (VPS)

Déploiement sur un serveur privé virtuel (VPS) avec Debian/Ubuntu.

### Prérequis

- VPS avec Debian 11+ ou Ubuntu 20.04+
- Accès SSH root ou sudo
- Nom de domaine configuré (optionnel mais recommandé)

### 1. Installation de Deno

```bash
# Se connecter au VPS
ssh user@your-server.com

# Installer Deno
curl -fsSL https://deno.land/install.sh | sh

# Ajouter Deno au PATH
echo 'export DENO_INSTALL="/home/user/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Vérifier l'installation
deno --version
```

### 2. Déployer le Projet

```bash
# Cloner le projet
cd /var/www
git clone https://github.com/cedric-famibelle-pronzola/medias-francais-api.git
cd medias-francais-api

# Créer le fichier .env
nano .env
```

### 3. Configuration (.env)

```bash
# Environnement
ENVIRONMENT=production

# Port
API_PORT=8000

# API Base Path (si derrière un proxy)
API_BASE_PATH=/

# Logging structuré
USE_STRUCTURED_LOGGER=true
LOG_STORAGE_BACKEND=auto  # auto, duckdb, ou postgres

# PostgreSQL (optionnel - sinon DuckDB sera utilisé)
# DATABASE_URL=postgresql://user:password@localhost:5432/logs

# Cache
CACHE_TTL=300000  # 5 minutes en ms

# Admin
ADMIN_KEY=your_secure_random_key_here

# CORS
CORS_ALLOWED_ORIGINS=votre-domaine.fr,autre-domaine.com
```

### 4. Build des Données

```bash
# Build et enrichissement
deno task build
deno task enrich
```

### 5. Service systemd

Créer un service systemd pour démarrage automatique :

```bash
sudo nano /etc/systemd/system/medias-francais-api.service
```

Contenu :

```ini
[Unit]
Description=Medias Francais API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/medias-francais-api
ExecStart=/home/user/.deno/bin/deno run --allow-net --allow-read --allow-env --allow-ffi main.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Démarrer le service :

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Démarrer le service
sudo systemctl start medias-francais-api

# Activer au démarrage
sudo systemctl enable medias-francais-api

# Vérifier le statut
sudo systemctl status medias-francais-api
```

### 6. Reverse Proxy avec Nginx (Optionnel)

```bash
# Installer Nginx
sudo apt update
sudo apt install nginx

# Créer la configuration
sudo nano /etc/nginx/sites-available/medias-francais-api
```

Contenu :

```nginx
server {
    listen 80;
    server_name api.votre-domaine.fr;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer la configuration :

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/medias-francais-api /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

### 7. SSL avec Let's Encrypt (Recommandé)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d api.votre-domaine.fr

# Renouvellement automatique (déjà configuré par défaut)
sudo certbot renew --dry-run
```

### 8. Mise à Jour

```bash
cd /var/www/medias-francais-api

# Pull des nouvelles modifications
git pull

# Rebuild si nécessaire
deno task build
deno task enrich

# Redémarrer le service
sudo systemctl restart medias-francais-api
```

---

## Deno Deploy (Serverless)

Déploiement sur [Deno Deploy](https://deno.com/deploy) pour un hébergement edge
serverless.

### Prérequis

- Compte [Deno Deploy](https://console.deno.com/)
- Dépôt GitHub

### 1. Créer un Projet Deno Deploy

1. Aller sur [console.deno.com](https://console.deno.com/)
2. Cliquer sur **New Project**
3. Connecter votre dépôt GitHub
4. Sélectionner le dépôt `medias-francais-api`
5. Configurer :
   - **Entry point** : `main.ts`
   - **Branch** : `master` (ou `main`)

### 2. Variables d'Environnement

Dans le dashboard Deno Deploy, onglet **Settings** → **Environment Variables** :

```bash
# Environnement
ENVIRONMENT=production

# Logging structuré (obligatoire PostgreSQL sur Deno Deploy)
USE_STRUCTURED_LOGGER=true
LOG_STORAGE_BACKEND=postgres

# PostgreSQL (Neon.tech recommandé)
DATABASE_URL=postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/logs

# Cache
CACHE_TTL=300000

# Admin
ADMIN_KEY=your_secure_random_key_here

# CORS
CORS_ALLOWED_ORIGINS=medias-francais.fr
```

### 3. Configuration PostgreSQL (Neon.tech)

**Pourquoi PostgreSQL ?** DuckDB nécessite accès au système de fichiers, non
disponible sur Deno Deploy (serverless).

**Providers recommandés** :

- [Neon.tech](https://neon.tech/) - PostgreSQL serverless (gratuit jusqu'à
  500MB) ⭐ **Recommandé**
- [Supabase](https://supabase.com/) - PostgreSQL + API (gratuit jusqu'à 500MB)
- [Railway](https://railway.app/) - PostgreSQL managé
- [Render](https://render.com/) - PostgreSQL managé

**Exemple avec Neon.tech** :

1. Créer un compte sur [neon.tech](https://neon.tech/)
2. Créer un nouveau projet : **New Project** → Région **Europe (Frankfurt)** ou
   **US East (Ohio)**
3. Copier la **Connection string**
4. Créer la table `logs` :

```sql
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  level VARCHAR(10) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  query TEXT,
  status INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  request_id VARCHAR(8) NOT NULL,
  referer TEXT
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_status ON logs(status);
CREATE INDEX idx_logs_path ON logs(path);
CREATE INDEX idx_logs_request_id ON logs(request_id);
```

5. Ajouter `DATABASE_URL` dans les variables d'environnement Deno Deploy

### 4. Build Commands

Dans les **Settings** du projet Deno Deploy :

**Install step** (optionnel) :

```bash
deno install
```

**Build command** :

```bash
deno task build:ci && deno task enrich
```

> **Note** : Le build se fait automatiquement avant chaque déploiement.

### 5. Déploiement

Le déploiement est automatique :

```bash
# Push vers GitHub
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin master
```

Deno Deploy détecte le push et déploie automatiquement :

1. Clone du dépôt
2. Exécution des build commands
3. Déploiement edge (multi-régions)
4. Health check
5. Live ✅

**URL de production** : `https://votre-projet.deno.dev`

### 6. Custom Domain (Optionnel)

Pour utiliser votre propre domaine :

1. Aller dans **Settings** → **Domains**
2. Cliquer sur **Add Domain**
3. Entrer votre domaine : `api.medias-francais.fr`
4. Configurer le DNS (CNAME ou A record) :

```
Type: CNAME
Name: api
Value: your-project.deno.dev
```

5. Attendre la propagation DNS (~5-30 min)
6. SSL automatique (Let's Encrypt)

### 7. Rollback

En cas de problème :

1. Aller dans **Deployments**
2. Trouver le dernier déploiement fonctionnel
3. Cliquer sur **⋯** → **Promote to Production**

Rollback instantané ! ⚡

---

## Variables d'Environnement

Liste complète des variables d'environnement supportées.

### Obligatoires

| Variable      | Description               | Valeurs                     | Défaut        |
| ------------- | ------------------------- | --------------------------- | ------------- |
| `ENVIRONMENT` | Environnement d'exécution | `development`, `production` | `development` |

### Optionnelles

| Variable                | Description                                    | Défaut                                                             |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| `API_PORT`              | Port du serveur                                | `8000`                                                             |
| `API_BASE_PATH`         | Chemin de base de l'API                        | `/`                                                                |
| `USE_STRUCTURED_LOGGER` | Activer les logs structurés                    | `false` (dev), `true` (prod)                                       |
| `LOG_STORAGE_BACKEND`   | Backend de logs (`auto`, `duckdb`, `postgres`) | `auto`                                                             |
| `DATABASE_URL`          | URL PostgreSQL pour logs                       | -                                                                  |
| `CACHE_TTL`             | Durée du cache en ms                           | `300000` (5 min)                                                   |
| `ADMIN_KEY`             | Clé d'administration (invalidation cache)      | -                                                                  |
| `CORS_ALLOWED_ORIGINS`  | Domaines autorisés CORS (séparés par `,`)      | `medias-francais.fr`                                               |
| `GH_SOURCE`             | URL source GitHub TSV                          | `https://raw.githubusercontent.com/mdiplo/Medias_francais/master/` |

### Exemples de Configuration

**Développement Local** :

```bash
ENVIRONMENT=development
API_PORT=8000
USE_STRUCTURED_LOGGER=false
```

**VPS Production** :

```bash
ENVIRONMENT=production
API_PORT=8000
USE_STRUCTURED_LOGGER=true
LOG_STORAGE_BACKEND=duckdb
CACHE_TTL=300000
ADMIN_KEY=secret_key_here
CORS_ALLOWED_ORIGINS=medias-francais.fr
```

**Deno Deploy** :

```bash
ENVIRONMENT=production
USE_STRUCTURED_LOGGER=true
LOG_STORAGE_BACKEND=postgres
DATABASE_URL=postgresql://user:password@host:5432/logs
CACHE_TTL=300000
ADMIN_KEY=secret_key_here
CORS_ALLOWED_ORIGINS=medias-francais.fr
```

---

## Commandes de Build

### Commandes Disponibles

```bash
# Build : Télécharger TSV et convertir en JSON
deno task build

# Enrich : Enrichir les données avec chaînes de propriété
deno task enrich

# Dev : Démarrer en mode développement (watch)
deno task dev

# Start : Démarrer en mode production
deno task start

# Test : Exécuter tous les tests
deno task test

# Lint : Vérifier le code
deno task lint

# Format : Formatter le code
deno task fmt
```

### Pipeline de Déploiement

**Ordre d'exécution** :

```
1. deno task build (ou build:ci)
   ↓
2. deno task enrich
   ↓
3. deno task start
```

### Automatisation

**GitHub Actions (exemple)** :

```yaml
name: Deploy

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: denoland/setup-deno@v1
        with:
          deno-version: v2.x

      - name: Build data
        run: deno task build:ci

      - name: Enrich data
        run: deno task enrich

      - name: Run tests
        run: deno task test

      # Déploiement...
```

---

## Monitoring et Logs

### Logs Structurés

#### DuckDB (Local/VPS)

**Localisation** : `logs/access_logs.db`

**Requêtes d'analyse** :

```sql
-- Requêtes par jour
SELECT
  DATE(timestamp) as date,
  COUNT(*) as requests,
  AVG(duration) as avg_ms
FROM logs
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Endpoints les plus lents
SELECT
  path,
  AVG(duration) as avg_ms,
  COUNT(*) as count
FROM logs
GROUP BY path
ORDER BY avg_ms DESC
LIMIT 10;

-- Erreurs 5xx
SELECT timestamp, method, path, status, duration
FROM logs
WHERE status >= 500
ORDER BY timestamp DESC;
```

#### PostgreSQL (VPS/Deno Deploy)

Même structure que DuckDB, accessible via client PostgreSQL :

```bash
# Se connecter
psql $DATABASE_URL

# Analyser les logs
SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100;
```

### Healthcheck

**Endpoint** : `GET /health`

**Réponse** :

```json
{
  "status": "ok",
  "timestamp": "2025-12-11T12:00:00.000Z",
  "uptime": 3600
}
```

**Utilisation** :

```bash
# Vérifier la santé de l'API
curl https://api.medias-francais.fr/health

# Healthcheck automatique (cron)
*/5 * * * * curl -f https://api.medias-francais.fr/health || systemctl restart medias-francais-api
```

### Cache Stats

**Endpoint** : `GET /cache/stats`

**Réponse** :

```json
{
  "size": 150,
  "hits": 1234,
  "misses": 56,
  "hitRate": 0.957
}
```

### Métriques Deno Deploy

Dashboard Deno Deploy fournit :

- **Requests** : Requêtes par seconde
- **Latency** : P50, P95, P99
- **Errors** : Taux d'erreur 4xx/5xx
- **Logs** : Logs temps réel

---

## Troubleshooting

### Erreurs Courantes

#### 1. "Failed to load data"

**Cause** : Fichiers JSON non générés ou corrompus.

**Solution** :

```bash
# Reconstruire les données
deno task build
deno task enrich

# Vérifier les fichiers
ls -lh dist/enriched/
```

#### 2. "Permission denied" (Deno)

**Cause** : Permissions manquantes.

**Solution** :

```bash
# Permissions nécessaires :
deno run \
  --allow-net \       # Requêtes HTTP
  --allow-read \      # Lire fichiers
  --allow-env \       # Variables env
  --allow-ffi \       # DuckDB (si utilisé)
  main.ts
```

#### 3. "Rate limit non appliqué" (Deno Deploy)

**Cause** : Rate limiter en mémoire, chaque isolat a son propre compteur.

**Solution** : Pour rate limiting global, implémenter avec
[Deno KV](https://deno.com/kv).

#### 4. "Database connection failed" (PostgreSQL)

**Cause** : URL incorrecte ou base inaccessible.

**Solution** :

```bash
# Tester la connexion
psql $DATABASE_URL

# Vérifier le format
# postgresql://user:password@host:5432/database
```

#### 5. "CORS error" en production

**Cause** : Domaine non autorisé.

**Solution** :

```bash
# Ajouter le domaine
CORS_ALLOWED_ORIGINS=medias-francais.fr,autre-domaine.com
```

#### 6. Tests échouent

**Cause** : Données mock obsolètes ou changements API.

**Solution** :

```bash
# Relancer build et tests
deno task build
deno task enrich
deno task test
```

### Logs de Debug

**Mode développement** :

```typescript
// Logger simple activé automatiquement
<-- GET /medias
--> GET /medias 200 42ms
```

**Mode production** :

```bash
# Vérifier les logs structurés
# DuckDB
deno run --allow-read --allow-ffi -A https://deno.land/x/duckdb/cli.ts logs/access_logs.db
SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10;

# PostgreSQL
psql $DATABASE_URL -c "SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10;"
```

---

## Ressources

### Documentation

- [Deno Deploy](https://docs.deno.com/deploy/manual/)
- [Hono Framework](https://hono.dev/)
- [Neon.tech](https://neon.tech/docs/)
- [Système de logging](./logging.md)

### Support

- **Issues** :
  [GitHub Issues](https://github.com/cedric-famibelle-pronzola/medias-francais-api/issues)
- **Documentation API** : https://api.medias-francais.fr/

---

**Dernière mise à jour** : Décembre 2025
