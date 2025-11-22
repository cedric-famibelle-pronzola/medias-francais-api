# Script de build

Le script `build.ts` permet de récupérer les données TSV depuis le dépôt GitHub source et de les convertir en fichiers JSON.

## Utilisation

```bash
deno task build
```

## Fonctionnement

1. **Récupération des données** : Le script fetch les fichiers TSV depuis l'URL configurée dans la variable d'environnement `GITHUB_SOURCE`
2. **Parsing** : Utilisation de PapaParse pour convertir les TSV en objets JavaScript
3. **Export** : Génération des fichiers JSON dans le dossier `dist/`

## Structure de sortie

```
dist/
├── main/
│   ├── personnes.json
│   ├── medias.json
│   └── organisations.json
└── detailed/
    ├── personne-media.json
    ├── personne-organisation.json
    ├── organisation-organisation.json
    └── organisation-media.json
```

### Fichiers principaux (`dist/main/`)

- **personnes.json** : Liste des personnes physiques actionnaires
- **medias.json** : Liste des médias
- **organisations.json** : Liste des organisations/personnes morales

### Fichiers détaillés (`dist/detailed/`)

- **personne-media.json** : Liens entre personnes et médias
- **personne-organisation.json** : Liens entre personnes et organisations
- **organisation-organisation.json** : Liens entre organisations
- **organisation-media.json** : Liens entre organisations et médias

## Configuration

Le script nécessite la variable d'environnement `GITHUB_SOURCE` qui pointe vers l'URL de base des fichiers TSV.

Créer un fichier `.env` à la racine du projet :

```env
GITHUB_SOURCE=https://raw.githubusercontent.com/mdiplo/Medias_francais/master/
```

## Permissions Deno

Le script requiert les permissions suivantes :

- `--env-file` : Charger le fichier .env
- `--allow-env` : Accéder aux variables d'environnement
- `--allow-net` : Effectuer des requêtes HTTP
- `--allow-write` : Écrire les fichiers JSON
- `--allow-read` : Lire le fichier .env
