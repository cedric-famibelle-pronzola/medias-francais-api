# Script d'enrichissement

Le script `enrich.ts` transforme les données brutes en données enrichies avec
les relations de propriété complètes.

## Utilisation

```bash
deno task enrich
```

> **Prérequis** : Exécuter `deno task build` d'abord pour générer les fichiers
> JSON dans `dist/`.

## Fonctionnement

1. **Chargement** : Lecture des fichiers JSON depuis `dist/main/` et
   `dist/detailed/`
2. **Indexation** : Création d'index pour recherche rapide des relations
3. **Enrichissement** : Calcul des chaînes de propriété et agrégation des
   données
4. **Export** : Génération des fichiers enrichis dans `dist/enriched/`

## Structure de sortie

```
dist/enriched/
├── medias.json
├── personnes.json
└── organisations.json
```

### medias.json

Pour chaque média :

```json
{
  "nom": "Le Monde",
  "type": "Presse",
  "periodicite": "Quotidien",
  "echelle": "National",
  "prix": "Payant",
  "disparu": false,
  "proprietaires": [
    {
      "nom": "Le Monde libre",
      "type": "organisation",
      "qualificatif": "égal à",
      "valeur": "100.00%"
    }
  ],
  "chaineProprietaires": [
    {
      "nom": "Xavier Niel",
      "chemin": ["Xavier Niel", "NJJ Presse", "Le Monde libre"],
      "valeurFinale": "100.00%"
    }
  ]
}
```

- **proprietaires** : Propriétaires directs (personnes ou organisations)
- **chaineProprietaires** : Personnes physiques ultimes avec le chemin de
  propriété

### personnes.json

Pour chaque personne :

```json
{
  "nom": "Bernard Arnault",
  "classements": {
    "challenges2024": 1,
    "forbes2024": true,
    "challenges2023": 1,
    "forbes2023": true,
    "challenges2022": 1,
    "forbes2022": true,
    "challenges2021": 1,
    "forbes2021": true
  },
  "mediasDirects": [],
  "mediasViaOrganisations": [
    {
      "nom": "Les Échos",
      "type": "Presse",
      "qualificatif": "égal à",
      "valeur": "100.00%",
      "via": "LVMH"
    }
  ],
  "organisations": [
    {
      "nom": "LVMH",
      "qualificatif": "égal à",
      "valeur": "47.00%"
    }
  ]
}
```

- **classements** : Rangs Challenges et présence Forbes par année
- **mediasDirects** : Médias détenus directement
- **mediasViaOrganisations** : Médias détenus via des organisations (avec le
  chemin)
- **organisations** : Organisations contrôlées

### organisations.json

Pour chaque organisation :

```json
{
  "nom": "Vivendi",
  "commentaire": "",
  "proprietaires": [
    {
      "nom": "Bolloré",
      "type": "organisation",
      "qualificatif": "égal à",
      "valeur": "27.00%"
    }
  ],
  "filiales": [
    {
      "nom": "Canal+ Group",
      "qualificatif": "égal à",
      "valeur": "100.00%"
    }
  ],
  "medias": [
    {
      "nom": "Canal +",
      "type": "Télévision",
      "qualificatif": "égal à",
      "valeur": "100.00%"
    }
  ]
}
```

- **proprietaires** : Qui possède cette organisation
- **filiales** : Organisations détenues
- **medias** : Médias détenus directement

## Permissions Deno

- `--allow-read` : Lire les fichiers JSON source
- `--allow-write` : Écrire les fichiers enrichis
