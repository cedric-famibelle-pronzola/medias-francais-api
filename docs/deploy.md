# Déploiement sur Deno Deploy

Guide pour déployer l'API sur [Deno Deploy](https://deno.com/deploy).

## Prérequis

- Compte [Deno Deploy](https://dash.deno.com/)
- Repository GitHub configuré

## Configuration

### 1. Créer un projet Deno Deploy

1. Aller sur [dash.deno.com](https://dash.deno.com/)
2. Cliquer sur **New Project**
3. Noter le nom du projet (ex: `medias-francais-api`)

### 2. Configurer les secrets GitHub

Dans les paramètres du repository GitHub, ajouter les secrets suivants :

| Secret                | Description                         |
| --------------------- | ----------------------------------- |
| `DENO_DEPLOY_PROJECT` | Nom du projet Deno Deploy           |
| `GH_SOURCE`       | URL de base des fichiers TSV source |

### 3. Variables d'environnement Deno Deploy

Dans le dashboard Deno Deploy, configurer les variables :

| Variable        | Description                 | Exemple |
| --------------- | --------------------------- | ------- |
| `API_PORT`      | Port du serveur (optionnel) | `8000`  |
| `API_BASE_PATH` | Chemin de base de l'API     | `/api`  |

## Déploiement automatique

Le déploiement se fait automatiquement via GitHub Actions lors d'un push sur
`main` ou `master`.

Le workflow :

1. Build les données TSV → JSON
2. Enrichit les données
3. Déploie sur Deno Deploy

## Déploiement manuel

### Via GitHub Actions

1. Aller dans l'onglet **Actions** du repository
2. Sélectionner le workflow **Deploy to Deno Deploy**
3. Cliquer sur **Run workflow**

### Via CLI

```bash
# Installer deployctl
deno install -Arf jsr:@deno/deployctl

# Build et enrichir les données
deno task build
deno task enrich

# Déployer
deployctl deploy --project=<project-name> --include=src,dist/enriched,deno.json,main.ts main.ts
```

## Structure des fichiers déployés

```
├── main.ts              # Point d'entrée
├── deno.json            # Configuration
├── src/                 # Code source
│   ├── app.ts
│   ├── data/
│   ├── middlewares/
│   ├── routers/
│   ├── services/
│   ├── openapi.ts
└── dist/
    └── enriched/        # Données JSON enrichies
        ├── medias.json
        ├── personnes.json
        └── organisations.json
```

## Limitations

### Rate Limiting

Le rate limiter utilise un store en mémoire. Sur Deno Deploy :

- Chaque isolat a son propre store
- Les limites sont par isolat, pas globales
- Pour un rate limiting distribué, utiliser [Deno KV](https://deno.com/kv)

### Fichiers statiques

Les fichiers dans `dist/enriched/` sont inclus dans le déploiement et chargés en
mémoire au démarrage.

## Monitoring

### Logs

Les logs sont disponibles dans le dashboard Deno Deploy :

1. Aller sur le projet
2. Cliquer sur **Logs**

### Métriques

Deno Deploy fournit des métriques de base :

- Requêtes par seconde
- Latence
- Erreurs

## Mise à jour des données

Pour mettre à jour les données :

1. Modifier les sources TSV si nécessaire
2. Relancer le workflow de déploiement

Les données seront rebuild et redéployées automatiquement.

## Troubleshooting

### Erreur "Failed to load data"

Vérifier que :

- Les fichiers `dist/enriched/*.json` sont générés
- Le workflow build et enrich s'est bien exécuté

### Erreur de déploiement

Vérifier :

- Les secrets GitHub sont configurés
- Le projet Deno Deploy existe
- Les permissions du token sont correctes

### Rate limit non appliqué

Normal sur Deno Deploy - chaque isolat a son propre compteur. Pour un rate
limiting global, implémenter avec Deno KV.
