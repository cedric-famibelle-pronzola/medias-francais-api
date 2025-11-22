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
diplomatique.

Les données sont organisées en sept tableaux :

- **personnes.tsv**, **medias.tsv** et **organisations.tsv** contiennent les
  médias, personnes physiques ou morales actionnaires
- **personne-media.tsv**, **personne-organisation.tsv**,
  **organisation-organisation.tsv** et **organisation-media.tsv** détaillent les
  liens capitalistiques entre ces actionnaires et médias qu'ils possèdent

## Prérequis

- [Deno](https://deno.com/) - Runtime JavaScript/TypeScript
  ([Installation](https://docs.deno.com/runtime/getting_started/installation/))

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

- **Swagger UI** : http://localhost:3000/docs
- **OpenAPI JSON** : http://localhost:3000/openapi.json

### Rate Limiting

L'API est protégée par un rate limiter :

- **60 requêtes par minute** par adresse IP
- Headers de réponse : `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
  `X-RateLimit-Reset`
- Code **429** en cas de dépassement

## Documentation

- [Diagrammes et architecture](docs/diagrams.md)
- [Script de build](docs/build.md)
- [Script d'enrichissement](docs/enrich.md)
- [API Endpoints](docs/api-endpoints.md)
- [Déploiement Deno Deploy](docs/deploy.md)
