# medias-francais-api

<p align="center">
  <img src="./medias-francais.png" alt="Médias Français API" width="200">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Deno-2.5.6-black?style=for-the-badge&logo=deno&logoColor=white" alt="Deno">
  <img src="https://img.shields.io/badge/Hono-4.0-orange?style=for-the-badge&logo=hono&logoColor=white" alt="Hono">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge" alt="License">
</p>

API exposant les données de propriété des médias français.

## Source des données

Les données proviennent du dépôt
[Médias français](https://github.com/mdiplo/Medias_francais) du Monde
diplomatique (Mise à jour en décembre 2024).

Les données sont organisées en sept tableaux :

- **personnes.tsv**, **medias.tsv** et **organisations.tsv** contiennent les
  médias, personnes physiques ou morales actionnaires
- **personne-media.tsv**, **personne-organisation.tsv**,
  **organisation-organisation.tsv** et **organisation-media.tsv** détaillent les
  liens capitalistiques entre ces actionnaires et médias qu'ils possèdent

## Prérequis

### Obligatoires

- [Deno](https://deno.com/) - Runtime JavaScript/TypeScript
  ([Installation](https://docs.deno.com/runtime/getting_started/installation/))

### Optionnels (Logs structurés)

Si vous souhaitez utiliser les logs structurés avec stockage en base de données :

#### Option 1 : DuckDB (recommandé pour développement local)

**Aucune installation requise** - DuckDB est automatiquement installé via npm lors du
`deno install`. Le fichier de logs sera créé automatiquement dans `logs/access_logs.db`.

**Activation** :
```bash
# .env
USE_STRUCTURED_LOGGER=true
# LOG_STORAGE_BACKEND=auto (DuckDB par défaut)
```

#### Option 2 : PostgreSQL (recommandé pour production)

**Prérequis** : Accès à une instance PostgreSQL (locale ou externe).

**Options** :
- **Local** : [Installation PostgreSQL](https://www.postgresql.org/download/)
- **Cloud** :
  - [Neon.tech](https://neon.tech/) - PostgreSQL serverless (utilisé par api.medias-francais.fr)
  - [Supabase](https://supabase.com/) - PostgreSQL + API
  - [Railway](https://railway.app/) - PostgreSQL managé
  - [Render](https://render.com/) - PostgreSQL managé
  - AWS RDS, Google Cloud SQL, Azure Database

**Activation** :
```bash
# .env
USE_STRUCTURED_LOGGER=true
LOG_STORAGE_BACKEND=postgres
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Création de la table** :
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

Pour plus de détails, consultez la [documentation du système de logging](docs/logging.md).

## Installation

```bash
cp .env.sample .env
deno install
```

## Scripts

```bash
# Générer les fichiers JSON à partir des données TSV
deno task build

# Enrichir les données avec les relations de propriété
deno task enrich

# Lancer le serveur de développement
deno task dev

# Exécuter les tests
deno task test

# Linter et formatter
deno task lint
deno task fmt
```

## API

### Documentation interactive

Une fois le serveur lancé, la documentation Swagger est disponible à :

- **Swagger UI** : http://localhost:8000/
- **OpenAPI JSON** : http://localhost:8000/openapi.json

### Rate Limiting

L'API est protégée par un rate limiter différencié :

- **Endpoints de recherche** : **20 requêtes par minute** par adresse IP
- **Autres endpoints** : **60 requêtes par minute** par adresse IP
- Headers de réponse : `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
  `X-RateLimit-Reset`
- Code **429** en cas de dépassement

## Documentation

- [Diagrammes et architecture](docs/diagrams.md)
- [Script de build](docs/build.md)
- [Script d'enrichissement](docs/enrich.md)
- [API Endpoints](docs/api-endpoints.md)
- [Exemples de requêtes (curl/httpie)](docs/exemples-requetes.md)
- [Système de logging](docs/logging.md)
- [Déploiement Deno Deploy](docs/deploy.md)
