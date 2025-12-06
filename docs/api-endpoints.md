# API Endpoints

Documentation des endpoints pour l'API Hono.

> 💡 **Besoin d'exemples pratiques ?** Consultez
> [Exemples de requêtes (curl/httpie)](./exemples-requetes.md) pour des exemples
> concrets et prêts à l'emploi.

## Base URL

```
http://localhost:3000
```

---

## Médias

### Liste des médias

```
GET /medias
```

Liste tous les médias avec pagination et filtres.

**Query Parameters :**

| Paramètre | Type    | Description                                                      |
| --------- | ------- | ---------------------------------------------------------------- |
| `type`    | string  | Filtrer par type : `Télévision`, `Radio`, `Presse`, `Site`       |
| `prix`    | string  | Filtrer par prix : `Gratuit`, `Payant`                           |
| `echelle` | string  | Filtrer par échelle : `National`, `Régional`, `Europe`, `Suisse` |
| `disparu` | boolean | Filtrer les médias disparus                                      |
| `page`    | number  | Numéro de page (défaut: 1)                                       |
| `limit`   | number  | Nombre de résultats par page (défaut: 20, max: 100)              |
| `sort`    | string  | Champ de tri : `nom`, `type`, `prix`, `echelle`                  |
| `order`   | string  | Ordre de tri : `asc` (croissant), `desc` (décroissant)           |

**Exemples de requêtes avec tri :**

```
# Trier par nom en ordre alphabétique
GET /medias?sort=nom&order=asc

# Trier par type en ordre décroissant
GET /medias?sort=type&order=desc

# Combiner filtres et tri
GET /medias?prix=Payant&sort=nom&order=asc&page=1&limit=20
```

> ⚠️ **Note** : Le paramètre `sort` est requis pour activer le tri. Le paramètre
> `order` seul (sans `sort`) n'a aucun effet.

**Exemple de réponse :**

```json
{
  "data": [
    {
      "nom": "Le Monde",
      "type": "Presse (généraliste  politique  économique)",
      "periodicite": "Quotidien",
      "echelle": "National",
      "prix": "Payant",
      "disparu": false,
      "proprietaires": [...],
      "chaineProprietaires": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### Détail d'un média

```
GET /medias/:nom
```

Récupère les informations complètes d'un média.

**Paramètres URL :**

| Paramètre | Type   | Description                |
| --------- | ------ | -------------------------- |
| `nom`     | string | Nom du média (URL encoded) |

**Exemple de réponse :**

```json
{
  "nom": "BFM TV",
  "type": "Télévision",
  "periodicite": "",
  "echelle": "",
  "prix": "Gratuit",
  "disparu": false,
  "proprietaires": [
    {
      "nom": "Altice Média",
      "type": "organisation",
      "qualificatif": "égal à",
      "valeur": "100.00%"
    }
  ],
  "chaineProprietaires": [
    {
      "nom": "Patrick Drahi",
      "chemin": ["Patrick Drahi", "Altice", "Altice Média"],
      "valeurFinale": "100.00%"
    }
  ]
}
```

---

### Propriétaires d'un média

```
GET /medias/:nom/proprietaires
```

Liste des propriétaires directs d'un média.

**Exemple de réponse :**

```json
{
  "media": "BFM TV",
  "proprietaires": [
    {
      "nom": "Altice Média",
      "type": "organisation",
      "qualificatif": "égal à",
      "valeur": "100.00%"
    }
  ]
}
```

---

### Propriétaires ultimes d'un média

```
GET /medias/:nom/proprietaires-ultimes
```

Chaîne de propriété complète jusqu'aux personnes physiques.

**Exemple de réponse :**

```json
{
  "media": "6ter",
  "proprietairesUltimes": [
    {
      "nom": "Rodolphe Saadé",
      "chemin": ["Rodolphe Saadé", "CMA CGM", "Groupe M6"],
      "valeurFinale": "100.00%"
    },
    {
      "nom": "Famille Mohn",
      "chemin": ["Famille Mohn", "Bertelsmann", "RTL Group", "Groupe M6"],
      "valeurFinale": "100.00%"
    }
  ]
}
```

---

### Recherche de médias

```
GET /medias/search
```

Recherche de médias par nom.

**Query Parameters :**

| Paramètre | Type    | Description                                                    |
| --------- | ------- | -------------------------------------------------------------- |
| `q`       | string  | Terme de recherche (min 2 caractères)                          |
| `extend`  | boolean | Si `true`, retourne toutes les infos (défaut: `false`, simple) |

**Modes de recherche :**

- **Mode simple** (`extend=false` ou omis) : Retourne uniquement `nom` et `type`
- **Mode enrichi** (`extend=true`) : Retourne toutes les informations du média
  (propriétaires, chaîne de propriétaires, etc.)

**Exemples de requêtes :**

```
# Recherche simple (nom et type uniquement)
GET /medias/search?q=monde

# Recherche enrichie (toutes les informations)
GET /medias/search?q=monde&extend=true
```

**Exemple de réponse (mode simple) :**

```json
{
  "query": "monde",
  "count": 5,
  "results": [
    {
      "nom": "Le Monde",
      "type": "Presse (généraliste  politique  économique)"
    },
    {
      "nom": "Le Monde diplomatique",
      "type": "Presse (généraliste  politique  économique)"
    }
  ]
}
```

**Exemple de réponse (mode enrichi avec `extend=true`) :**

```json
{
  "query": "monde",
  "count": 5,
  "results": [
    {
      "nom": "Le Monde",
      "type": "Presse (généraliste  politique  économique)",
      "periodicite": "Quotidien",
      "echelle": "National",
      "prix": "Payant",
      "disparu": false,
      "proprietaires": [
        {
          "nom": "Groupe Le Monde",
          "type": "organisation",
          "qualificatif": "égal à",
          "valeur": "100.00%"
        }
      ],
      "chaineProprietaires": [...]
    }
  ]
}
```

---

## Personnes

### Liste des personnes

```
GET /personnes
```

Liste toutes les personnes avec filtres.

**Query Parameters :**

| Paramètre        | Type    | Description                                            |
| ---------------- | ------- | ------------------------------------------------------ |
| `forbes`         | boolean | Filtrer les milliardaires Forbes                       |
| `challenges_max` | number  | Rang maximum Challenges (ex: 100 pour top 100)         |
| `annee`          | number  | Année de référence : `2021`, `2022`, `2023`, `2024`    |
| `has_medias`     | boolean | Possède au moins un média                              |
| `page`           | number  | Numéro de page (défaut: 1)                             |
| `limit`          | number  | Résultats par page (défaut: 20, max: 100)              |
| `sort`           | string  | Champ de tri : `nom`, `challenges2024`, `nbMedias`     |
| `order`          | string  | Ordre de tri : `asc` (croissant), `desc` (décroissant) |

**Exemples de requêtes avec tri :**

```
# Trier par nom en ordre alphabétique
GET /personnes?sort=nom&order=asc

# Trier par nombre de médias (décroissant)
GET /personnes?sort=nbMedias&order=desc

# Trier les milliardaires Forbes par classement Challenges
GET /personnes?forbes=true&sort=challenges2024&order=asc
```

**Exemple de réponse :**

```json
{
  "data": [
    {
      "nom": "Bernard Arnault",
      "classements": {
        "challenges2024": 1,
        "forbes2024": true
      },
      "mediasDirects": [],
      "mediasViaOrganisations": [...],
      "organisations": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85
  }
}
```

---

### Détail d'une personne

```
GET /personnes/:nom
```

Récupère les informations complètes d'une personne.

**Exemple de réponse :**

```json
{
  "nom": "Vincent Bolloré",
  "classements": {
    "challenges2024": 10,
    "forbes2024": true,
    "challenges2023": 9,
    "forbes2023": true,
    "challenges2022": 9,
    "forbes2022": true,
    "challenges2021": 10,
    "forbes2021": true
  },
  "mediasDirects": [],
  "mediasViaOrganisations": [
    {
      "nom": "Canal +",
      "type": "Télévision",
      "qualificatif": "égal à",
      "valeur": "100.00%",
      "via": "Bolloré → Vivendi"
    },
    {
      "nom": "CNews",
      "type": "Télévision",
      "qualificatif": "égal à",
      "valeur": "100.00%",
      "via": "Bolloré → Vivendi"
    }
  ],
  "organisations": [
    {
      "nom": "Bolloré",
      "qualificatif": "égal à",
      "valeur": "65.00%"
    }
  ]
}
```

---

### Médias d'une personne

```
GET /personnes/:nom/medias
```

Tous les médias détenus par une personne (directs et via organisations).

**Exemple de réponse :**

```json
{
  "personne": "Xavier Niel",
  "mediasDirects": [],
  "mediasViaOrganisations": [
    {
      "nom": "Le Monde",
      "type": "Presse (généraliste  politique  économique)",
      "via": "NJJ Presse → Le Monde libre"
    }
  ],
  "total": 5
}
```

---

### Organisations d'une personne

```
GET /personnes/:nom/organisations
```

Organisations contrôlées par une personne.

**Exemple de réponse :**

```json
{
  "personne": "Patrick Drahi",
  "organisations": [
    {
      "nom": "Altice",
      "qualificatif": "égal à",
      "valeur": "92.00%"
    }
  ]
}
```

---

### Top Challenges

```
GET /personnes/top-challenges
```

Classement des personnes les plus riches.

**Query Parameters :**

| Paramètre | Type   | Description                                           |
| --------- | ------ | ----------------------------------------------------- |
| `annee`   | number | Année : `2021`, `2022`, `2023`, `2024` (défaut: 2024) |
| `limit`   | number | Nombre de résultats (défaut: 10)                      |

**Exemple de réponse :**

```json
{
  "annee": 2024,
  "classement": [
    {
      "rang": 1,
      "nom": "Bernard Arnault",
      "forbes": true,
      "nbMedias": 3
    },
    {
      "rang": 2,
      "nom": "Françoise Bettencourt Meyers",
      "forbes": true,
      "nbMedias": 0
    }
  ]
}
```

---

## Organisations

### Liste des organisations

```
GET /organisations
```

Liste toutes les organisations avec filtres.

**Query Parameters :**

| Paramètre      | Type    | Description                                            |
| -------------- | ------- | ------------------------------------------------------ |
| `has_medias`   | boolean | Possède au moins un média                              |
| `has_filiales` | boolean | Possède au moins une filiale                           |
| `page`         | number  | Numéro de page (défaut: 1)                             |
| `limit`        | number  | Résultats par page (défaut: 20, max: 100)              |
| `sort`         | string  | Champ de tri : `nom`, `nbMedias`, `nbFiliales`         |
| `order`        | string  | Ordre de tri : `asc` (croissant), `desc` (décroissant) |

**Exemples de requêtes avec tri :**

```
# Trier par nom en ordre alphabétique
GET /organisations?sort=nom&order=asc

# Trier par nombre de médias (décroissant)
GET /organisations?sort=nbMedias&order=desc

# Trier par nombre de filiales
GET /organisations?sort=nbFiliales&order=desc
```

**Exemple de réponse :**

```json
{
  "data": [
    {
      "nom": "Vivendi",
      "commentaire": "",
      "proprietaires": [...],
      "filiales": [...],
      "medias": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120
  }
}
```

---

### Détail d'une organisation

```
GET /organisations/:nom
```

Récupère les informations complètes d'une organisation.

**Exemple de réponse :**

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

---

### Filiales d'une organisation

```
GET /organisations/:nom/filiales
```

Liste des filiales d'une organisation.

**Exemple de réponse :**

```json
{
  "organisation": "Bertelsmann",
  "filiales": [
    {
      "nom": "RTL Group",
      "qualificatif": "égal à",
      "valeur": "75.00%"
    }
  ]
}
```

---

### Médias d'une organisation

```
GET /organisations/:nom/medias
```

Médias détenus directement par une organisation.

**Exemple de réponse :**

```json
{
  "organisation": "Groupe M6",
  "medias": [
    {
      "nom": "M6",
      "type": "Télévision",
      "qualificatif": "égal à",
      "valeur": "100.00%"
    },
    {
      "nom": "6ter",
      "type": "Télévision",
      "qualificatif": "égal à",
      "valeur": "100.00%"
    }
  ]
}
```

---

### Hiérarchie d'une organisation

```
GET /organisations/:nom/hierarchie
```

Arbre complet de l'organisation : propriétaires parents et filiales enfants.

**Exemple de réponse :**

```json
{
  "organisation": "RTL Group",
  "parents": [
    {
      "nom": "Bertelsmann",
      "type": "organisation",
      "valeur": "75.00%"
    }
  ],
  "enfants": [
    {
      "nom": "Groupe M6",
      "valeur": "48.00%"
    }
  ]
}
```

---

## Statistiques

### Statistiques globales

```
GET /stats
```

Statistiques générales sur les données.

**Exemple de réponse :**

```json
{
  "totaux": {
    "medias": 150,
    "personnes": 85,
    "organisations": 120
  },
  "mediasParType": {
    "Télévision": 45,
    "Radio": 20,
    "Presse (généraliste  politique  économique)": 60,
    "Site": 25
  },
  "mediasParPrix": {
    "Gratuit": 80,
    "Payant": 70
  },
  "mediasDisparus": 5
}
```

---

### Concentration des médias

```
GET /stats/concentration
```

Analyse de la concentration de la propriété des médias.

**Exemple de réponse :**

```json
{
  "parPersonnes": [
    {
      "nom": "Vincent Bolloré",
      "nbMedias": 12
    },
    {
      "nom": "Patrick Drahi",
      "nbMedias": 8
    }
  ],
  "parOrganisations": [
    {
      "nom": "Vivendi",
      "nbMedias": 10
    },
    {
      "nom": "Groupe M6",
      "nbMedias": 6
    }
  ]
}
```

---

## Référentiels

### Types de médias

```
GET /types
```

Liste des types de médias disponibles.

**Exemple de réponse :**

```json
{
  "types": [
    "Télévision",
    "Radio",
    "Presse (généraliste  politique  économique)",
    "Site"
  ]
}
```

---

### Échelles géographiques

```
GET /echelles
```

Liste des échelles géographiques.

**Exemple de réponse :**

```json
{
  "echelles": [
    "National",
    "Régional",
    "Europe",
    "Suisse"
  ]
}
```

---

## Rate Limiting

L'API est protégée par un rate limiter différencié pour éviter les abus.

**Configuration :**

- **Endpoints de recherche** (`/*/search`) : **20 requêtes par minute** par
  adresse IP
- **Autres endpoints API** : **60 requêtes par minute** par adresse IP
- Endpoints exclus : `/health`, `/favicon.ico`, `/robots.txt`
- Fenêtre glissante de 60 secondes

**Headers de réponse :**

| Header                  | Description                             |
| ----------------------- | --------------------------------------- |
| `X-RateLimit-Limit`     | Nombre maximum de requêtes autorisées   |
| `X-RateLimit-Remaining` | Nombre de requêtes restantes            |
| `X-RateLimit-Reset`     | Timestamp Unix de réinitialisation      |
| `Retry-After`           | Secondes avant nouvelle tentative (429) |

**Exemple de réponse 429 :**

```json
{
  "error": {
    "id": "a7f5c8e3-2b4d-4f9a-8c6e-1d3b5a7f9c2e",
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Trop de requêtes, veuillez réessayer plus tard."
  }
}
```

---

## Documentation interactive

- **Swagger UI** : http://localhost:8000/
- **OpenAPI JSON** : http://localhost:8000/openapi.json

---

## Codes de réponse

| Code  | Description                                           |
| ----- | ----------------------------------------------------- |
| `200` | Succès                                                |
| `400` | Requête invalide (paramètres manquants ou incorrects) |
| `404` | Ressource non trouvée                                 |
| `429` | Trop de requêtes (rate limit dépassé)                 |
| `500` | Erreur serveur                                        |

## Format d'erreur

Toutes les erreurs retournent un format structuré avec un ID unique pour le
tracking.

**Structure :**

```json
{
  "error": {
    "id": "uuid-unique",
    "code": "ERROR_CODE",
    "message": "Description de l'erreur"
  }
}
```

**Codes d'erreur :**

| Code                  | HTTP | Description                 |
| --------------------- | ---- | --------------------------- |
| `NOT_FOUND`           | 404  | Ressource non trouvée       |
| `VALIDATION_ERROR`    | 400  | Paramètres invalides        |
| `BAD_REQUEST`         | 400  | Requête malformée           |
| `RATE_LIMIT_EXCEEDED` | 429  | Limite de requêtes dépassée |
| `INTERNAL_ERROR`      | 500  | Erreur serveur interne      |

**Exemples :**

```json
// Ressource non trouvée
{
  "error": {
    "id": "a7f5c8e3-2b4d-4f9a-8c6e-1d3b5a7f9c2e",
    "code": "NOT_FOUND",
    "message": "Média 'XYZ' non trouvé",
    "details": {
      "resource": "media"
    }
  }
}

// Validation error
{
  "error": {
    "id": "b8e6d9f4-3c5e-5g0b-9d7f-2e4c6b8a0d1f",
    "code": "VALIDATION_ERROR",
    "message": "Query must be at least 2 characters long",
    "details": {
      "field": "q"
    }
  }
}
```
