# Exemples de Requêtes API

Ce document contient des exemples pratiques d'utilisation de l'API avec `curl`
et `httpie`.

## Prérequis

### Installation de curl

**Linux (Debian/Ubuntu)**

```bash
sudo apt install curl
```

**Linux (Fedora/RHEL)**

```bash
sudo dnf install curl
```

**Linux (Arch Linux)**

```bash
sudo pacman -S curl
```

**macOS**

```bash
# curl est préinstallé
# ou via Homebrew :
brew install curl
```

**Windows**

```bash
# curl est préinstallé sur Windows 10+
# ou via winget :
winget install curl.curl
```

### Installation de httpie

**Linux (Debian/Ubuntu)**

```bash
# Via apt
sudo apt install httpie

# Via snap
sudo snap install httpie

# Via pip
pip install httpie
```

**Linux (Fedora/RHEL)**

```bash
# Via dnf
sudo dnf install httpie

# Via pip
pip install httpie
```

**Linux (Arch Linux)**

```bash
# Via pacman
sudo pacman -S httpie

# Via pip
pip install httpie
```

**macOS**

```bash
brew install httpie
```

**Windows**

```bash
# Via pip
pip install httpie

# Via winget
winget install httpie.httpie
```

---

## Variables d'environnement

Pour simplifier les exemples, définissez la base URL :

```bash
# Développement local
export API_BASE="http://localhost:8000"

# Production
export API_BASE="https://votre-api.com"
```

---

## 📺 Médias

### Liste simple

**curl**

```bash
curl "$API_BASE/medias"
```

**httpie**

```bash
http GET $API_BASE/medias
```

### Avec pagination

**curl**

```bash
curl "$API_BASE/medias?page=1&limit=10"
```

**httpie**

```bash
http GET $API_BASE/medias page==1 limit==10
```

### Filtrer par type

**curl**

```bash
curl "$API_BASE/medias?type=Télévision"
```

**httpie**

```bash
http GET $API_BASE/medias type=="Télévision"
```

### Filtrer par prix

**curl**

```bash
curl "$API_BASE/medias?prix=Payant"
```

**httpie**

```bash
http GET $API_BASE/medias prix=="Payant"
```

### Trier par nom (ordre alphabétique)

**curl**

```bash
curl "$API_BASE/medias?sort=nom&order=asc"
```

**httpie**

```bash
http GET $API_BASE/medias sort==nom order==asc
```

### Trier par nom (ordre inverse)

**curl**

```bash
curl "$API_BASE/medias?sort=nom&order=desc"
```

**httpie**

```bash
http GET $API_BASE/medias sort==nom order==desc
```

### Combinaison : filtres + tri + pagination

**curl**

```bash
curl "$API_BASE/medias?prix=Payant&sort=nom&order=asc&page=1&limit=20"
```

**httpie**

```bash
http GET $API_BASE/medias prix=="Payant" sort==nom order==asc page==1 limit==20
```

### Détail d'un média

**curl**

```bash
curl "$API_BASE/medias/Le%20Monde"
```

**httpie**

```bash
http GET "$API_BASE/medias/Le Monde"
```

### Propriétaires d'un média

**curl**

```bash
curl "$API_BASE/medias/BFM%20TV/proprietaires"
```

**httpie**

```bash
http GET "$API_BASE/medias/BFM TV/proprietaires"
```

### Propriétaires ultimes d'un média

**curl**

```bash
curl "$API_BASE/medias/Le%20Monde/proprietaires-ultimes"
```

**httpie**

```bash
http GET "$API_BASE/medias/Le Monde/proprietaires-ultimes"
```

### Recherche de médias (mode simple)

**curl**

```bash
curl "$API_BASE/medias/search?q=monde"
```

**httpie**

```bash
http GET $API_BASE/medias/search q==monde
```

### Recherche de médias (mode enrichi)

Avec le paramètre `extend=true`, les résultats incluent toutes les informations
(propriétaires, chaîne de propriétaires, etc.).

**curl**

```bash
curl "$API_BASE/medias/search?q=monde&extend=true"
```

**httpie**

```bash
http GET $API_BASE/medias/search q==monde extend==true
```

---

## 👤 Personnes

### Liste simple

**curl**

```bash
curl "$API_BASE/personnes"
```

**httpie**

```bash
http GET $API_BASE/personnes
```

### Filtrer les milliardaires Forbes

**curl**

```bash
curl "$API_BASE/personnes?forbes=true"
```

**httpie**

```bash
http GET $API_BASE/personnes forbes==true
```

### Top 100 Challenges

**curl**

```bash
curl "$API_BASE/personnes?challenges_max=100"
```

**httpie**

```bash
http GET $API_BASE/personnes challenges_max==100
```

### Personnes possédant des médias

**curl**

```bash
curl "$API_BASE/personnes?has_medias=true"
```

**httpie**

```bash
http GET $API_BASE/personnes has_medias==true
```

### Trier par nombre de médias (décroissant)

**curl**

```bash
curl "$API_BASE/personnes?sort=nbMedias&order=desc"
```

**httpie**

```bash
http GET $API_BASE/personnes sort==nbMedias order==desc
```

### Trier les milliardaires par classement Challenges

**curl**

```bash
curl "$API_BASE/personnes?forbes=true&sort=challenges2024&order=asc"
```

**httpie**

```bash
http GET $API_BASE/personnes forbes==true sort==challenges2024 order==asc
```

### Détail d'une personne

**curl**

```bash
curl "$API_BASE/personnes/Vincent%20Bolloré"
```

**httpie**

```bash
http GET "$API_BASE/personnes/Vincent Bolloré"
```

### Médias d'une personne

**curl**

```bash
curl "$API_BASE/personnes/Xavier%20Niel/medias"
```

**httpie**

```bash
http GET "$API_BASE/personnes/Xavier Niel/medias"
```

### Organisations d'une personne

**curl**

```bash
curl "$API_BASE/personnes/Patrick%20Drahi/organisations"
```

**httpie**

```bash
http GET "$API_BASE/personnes/Patrick Drahi/organisations"
```

### Top Challenges (classement)

**curl**

```bash
# Top 10 de 2024 (par défaut)
curl "$API_BASE/personnes/top-challenges"

# Top 20 de 2023
curl "$API_BASE/personnes/top-challenges?annee=2023&limit=20"
```

**httpie**

```bash
# Top 10 de 2024
http GET $API_BASE/personnes/top-challenges

# Top 20 de 2023
http GET $API_BASE/personnes/top-challenges annee==2023 limit==20
```

---

## 🏢 Organisations

### Liste simple

**curl**

```bash
curl "$API_BASE/organisations"
```

**httpie**

```bash
http GET $API_BASE/organisations
```

### Organisations possédant des médias

**curl**

```bash
curl "$API_BASE/organisations?has_medias=true"
```

**httpie**

```bash
http GET $API_BASE/organisations has_medias==true
```

### Organisations avec filiales

**curl**

```bash
curl "$API_BASE/organisations?has_filiales=true"
```

**httpie**

```bash
http GET $API_BASE/organisations has_filiales==true
```

### Trier par nombre de médias

**curl**

```bash
curl "$API_BASE/organisations?sort=nbMedias&order=desc"
```

**httpie**

```bash
http GET $API_BASE/organisations sort==nbMedias order==desc
```

### Détail d'une organisation

**curl**

```bash
curl "$API_BASE/organisations/Vivendi"
```

**httpie**

```bash
http GET $API_BASE/organisations/Vivendi
```

### Filiales d'une organisation

**curl**

```bash
curl "$API_BASE/organisations/Bertelsmann/filiales"
```

**httpie**

```bash
http GET $API_BASE/organisations/Bertelsmann/filiales
```

### Médias d'une organisation

**curl**

```bash
curl "$API_BASE/organisations/Groupe%20M6/medias"
```

**httpie**

```bash
http GET "$API_BASE/organisations/Groupe M6/medias"
```

### Hiérarchie d'une organisation

**curl**

```bash
curl "$API_BASE/organisations/RTL%20Group/hierarchie"
```

**httpie**

```bash
http GET "$API_BASE/organisations/RTL Group/hierarchie"
```

---

## 📊 Statistiques

### Statistiques globales

**curl**

```bash
curl "$API_BASE/stats"
```

**httpie**

```bash
http GET $API_BASE/stats
```

### Concentration des médias

**curl**

```bash
curl "$API_BASE/stats/concentration"
```

**httpie**

```bash
http GET $API_BASE/stats/concentration
```

---

## 📚 Référentiels

### Types de médias

**curl**

```bash
curl "$API_BASE/types"
```

**httpie**

```bash
http GET $API_BASE/types
```

### Échelles géographiques

**curl**

```bash
curl "$API_BASE/echelles"
```

**httpie**

```bash
http GET $API_BASE/echelles
```

---

## 🔧 Utilitaires

### Health check

**curl**

```bash
curl "$API_BASE/health"
```

**httpie**

```bash
http GET $API_BASE/health
```

### Statistiques du cache

**curl**

```bash
curl "$API_BASE/cache/stats"
```

**httpie**

```bash
http GET $API_BASE/cache/stats
```

### Invalidation du cache (admin)

**curl**

```bash
curl -X POST "$API_BASE/cache/invalidate" \
  -H "X-Admin-Key: votre-cle-secrete"
```

**httpie**

```bash
http POST $API_BASE/cache/invalidate \
  X-Admin-Key:votre-cle-secrete
```

---

## 📖 OpenAPI

### Documentation Swagger UI

Ouvrir dans le navigateur :

```
http://localhost:8000/
```

### Spécification OpenAPI (JSON)

**curl**

```bash
curl "$API_BASE/openapi.json"
```

**httpie**

```bash
http GET $API_BASE/openapi.json
```

---

## 💡 Conseils

### Formater la sortie JSON (curl)

Avec `jq` :

```bash
curl "$API_BASE/medias" | jq
```

### Voir les headers de réponse (curl)

```bash
curl -I "$API_BASE/medias"
# ou
curl -v "$API_BASE/medias"
```

### Voir les headers de réponse (httpie)

```bash
http -h $API_BASE/medias
# ou
http -v $API_BASE/medias
```

### Sauvegarder la réponse dans un fichier

**curl**

```bash
curl "$API_BASE/medias" -o medias.json
```

**httpie**

```bash
http GET $API_BASE/medias > medias.json
```

### Suivre les redirections (curl)

```bash
curl -L "$API_BASE/medias"
```

---

## 🚨 Gestion des erreurs

### Exemple d'erreur 404

**curl**

```bash
curl "$API_BASE/medias/NonExistant"
```

**Réponse**

```json
{
  "error": {
    "id": "a7f5c8e3-2b4d-4f9a-8c6e-1d3b5a7f9c2e",
    "code": "NOT_FOUND",
    "message": "Média 'NonExistant' non trouvé",
    "details": {
      "resource": "media"
    }
  }
}
```

### Exemple d'erreur de validation

**curl**

```bash
curl "$API_BASE/medias/search?q=a"
```

**Réponse**

```json
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

### Exemple de rate limit dépassé

**Réponse 429**

```json
{
  "error": {
    "id": "c9f7e0a5-4d6f-6h1c-0e8g-3f5d7c9b1e2a",
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Trop de requêtes, veuillez réessayer plus tard."
  }
}
```

**Headers utiles**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1732547832
Retry-After: 42
```

---

## 🔗 Ressources

- [Documentation curl](https://curl.se/docs/)
- [Documentation httpie](https://httpie.io/docs/cli)
- [Documentation API complète](./api-endpoints.md)
- [Spécification OpenAPI](http://localhost:8000/openapi.json)
