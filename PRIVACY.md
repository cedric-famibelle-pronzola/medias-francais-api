# Politique de confidentialité et collecte de données

## Données collectées

L'API Médias Français collecte et stocke les informations suivantes pour chaque requête HTTP :

- **Adresse IP** du client (IPv4 ou IPv6)
- **User-Agent** complet contenant :
  - Nom et version du navigateur (ex: Chrome 131, Firefox 133)
  - Système d'exploitation et version (ex: Windows 10, macOS 14.1, Linux)
  - Architecture du processeur (ex: x86_64, ARM64)
  - Outil HTTP utilisé (ex: curl, Postman, Python requests, fetch API)
  - Parfois : modèle de l'appareil, résolution d'écran
- **Chemin de la requête** (endpoint API appelé, ex: `/medias`, `/personnes/search`)
- **Paramètres de requête** complets (query string, ex: `?type=Télévision&limit=20`)
- **Méthode HTTP** (GET, POST, PUT, DELETE, OPTIONS, etc.)
- **Code de statut HTTP** de la réponse (200, 404, 500, etc.)
- **Durée de traitement** de la requête en millisecondes
- **Referer** (URL de la page d'origine ayant déclenché la requête, si disponible)
- **Horodatage précis** de la requête (date et heure UTC avec millisecondes)

### Exemples concrets de données collectées

**Exemple 1 - Navigateur web :**
```json
{
  "ip": "203.0.113.42",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "path": "/medias",
  "query": "?type=Télévision&limit=20",
  "method": "GET",
  "status": 200,
  "duration": 45,
  "referer": "https://example.com/search",
  "timestamp": "2025-12-09T10:30:15.234Z"
}
```

**Exemple 2 - Script Python :**
```json
{
  "ip": "198.51.100.123",
  "userAgent": "python-requests/2.31.0",
  "path": "/personnes/search",
  "query": "?q=Bolloré",
  "method": "GET",
  "status": 200,
  "duration": 67,
  "referer": null,
  "timestamp": "2025-12-09T10:31:42.789Z"
}
```

## Justification légale de la collecte

La collecte de ces données est justifiée conformément au [Règlement (UE) 2016/679](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679) (RGPD) :

### 1. Intérêt légitime ([Article 6.1.f du RGPD](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679#d1e1888-1-1))

Nous poursuivons des intérêts légitimes qui ne portent pas atteinte à vos droits et libertés :

- **Sécurité** : Détection et prévention des abus, attaques DDoS, tentatives d'intrusion
- **Performance** : Analyse des temps de réponse et optimisation de l'infrastructure
- **Fiabilité** : Diagnostic des erreurs et amélioration de la qualité du service
- **Statistiques** : Compréhension de l'usage de l'API pour son amélioration

### 2. Obligation légale ([Article 6.1.c du RGPD](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679#d1e1888-1-1))

Le traitement est nécessaire au respect d'obligations légales :

- Conservation des logs pour conformité avec les obligations légales de sécurité des systèmes d'information
- Traçabilité en cas de demande des autorités compétentes (réquisitions judiciaires)

### 3. Principe de minimisation des données ([Article 5.1.c du RGPD](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679#d1e1807-1-1))

Mesures de proportionnalité appliquées :

- Seules les données strictement **nécessaires** aux finalités mentionnées sont collectées
- **Aucune donnée permettant une identification directe** n'est stockée (pas de cookies de tracking, pas de comptes utilisateurs, pas de numéros de téléphone)
- L'adresse IP seule ne constitue pas une donnée personnelle identifiante dans ce contexte d'usage public sans authentification
- Durée de conservation limitée à 6 mois (minimale pour les finalités de sécurité)

## Stockage des données

### En développement (local)

Les logs sont stockés localement dans une base de données DuckDB (`logs/access_logs.db`) sur votre machine.

### En production (api.medias-francais.fr)

L'API est hébergée sur **Deno Deploy** et les logs sont stockés de deux manières :

1. **Dashboard Deno Deploy** (court terme) :
   - Logs capturés automatiquement via `console.log()`
   - Accessibles dans le dashboard Deno Deploy
   - **Deno Land Inc**, société américaine basée à San Diego, CA

2. **Base de données PostgreSQL** (long terme) :
   - Hébergée sur **Neon.tech** (service PostgreSQL serverless)
   - Serveur situé sur **AWS eu-central-1** (Allemagne)
   - **Neon**, société américaine (Delaware)

**Transferts internationaux** : Les deux services (Deno Deploy et Neon) sont des sociétés américaines. Bien que les serveurs soient situés en Europe (Deno Deploy) et en Allemagne (Neon/AWS), vos données peuvent être accessibles depuis les États-Unis. En l'absence d'accord d'adéquation UE-USA complet depuis l'invalidation du Privacy Shield, ces transferts reposent sur :
- Les clauses contractuelles types de la Commission Européenne
- Les garanties de sécurité de Deno Deploy et Neon
- L'intérêt légitime du traitement (sécurité et fiabilité du service)

Pour plus d'informations :
- [Deno Deploy Documentation](https://docs.deno.com/deploy/)
- [Deno Privacy Policy](https://deno.com/privacy)
- [Neon Privacy Policy](https://neon.tech/privacy-policy)
- [Neon Security](https://neon.tech/security)

## Durée de conservation

Les logs sont conservés pour une durée limitée, conformément aux recommandations de la CNIL :

- **Production** : **6 mois maximum** (recommandation CNIL pour les logs de connexion)
- **Développement** : Conservation indéterminée (responsabilité du développeur)

### Justification de la durée

La durée de 6 mois est conforme à :
- La [recommandation CNIL sur la journalisation](https://www.cnil.fr/fr/la-cnil-publie-une-recommandation-relative-aux-mesures-de-journalisation) (6 mois pour les logs de connexion)
- Le principe de minimisation des données du RGPD (Article 5.1.c)
- L'équilibre entre sécurité (détection d'incidents) et respect de la vie privée

Cette durée permet :
- La détection et l'analyse d'incidents de sécurité
- Le diagnostic de problèmes techniques récurrents
- La production de statistiques d'usage mensuelles
- Le respect des droits des utilisateurs (suppression après 6 mois)

## Droits des utilisateurs

### Limitations importantes

En l'absence d'authentification sur cette API publique, **il est techniquement impossible de vérifier avec certitude l'identité d'un utilisateur** basé uniquement sur son adresse IP, car :

- Les adresses IP sont souvent **partagées** (entreprises, FAI, VPN, proxies)
- Les adresses IP sont souvent **dynamiques** et changent régulièrement
- Une même personne peut utiliser **plusieurs adresses IP** différentes
- **Impossible de prouver** qu'une personne était bien derrière une IP donnée à un moment précis

### Application des droits RGPD

Conformément aux [Articles 12 à 23 du RGPD](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679#d1e2254-1-1), vous disposez des droits suivants. Compte tenu des limitations techniques, voici comment ils s'appliquent :

**Exercice des droits individuels** :

- **[Droit d'accès](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679#d1e2606-1-1) (Article 15)** : Vous pouvez demander l'accès aux logs en fournissant votre adresse IP actuelle et la plage de dates concernées.

  **⚠️ Limitation importante** : Vous ne pouvez pas prouver formellement qu'une IP vous appartient de manière exclusive, car :
  - Nous ne pouvons pas vérifier votre identité (pas d'authentification)
  - Votre IP peut être partagée avec d'autres utilisateurs (entreprise, FAI, VPN)
  - Votre IP peut avoir changé depuis les requêtes concernées (IP dynamique)

  **En pratique** : Nous vous fournirons tous les logs correspondant à l'IP que vous indiquez, en sachant qu'ils peuvent contenir des requêtes effectuées par d'autres personnes. C'est une **limitation technique inévitable** dans un contexte d'API publique sans compte utilisateur.

- **[Droit de rectification](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679#d1e2702-1-1) (Article 16)** : Non applicable dans ce contexte. Les logs sont des enregistrements factuels horodatés et non modifiables par nature (intégrité des preuves).

- **[Droit à l'effacement](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679#d1e2734-1-1) (Article 17)** : Fournissez votre adresse IP et la plage de dates. Nous supprimerons les logs correspondants. **Attention** : cela peut affecter d'autres utilisateurs partageant la même IP (entreprise, FAI).

- **[Droit d'opposition](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679#d1e2874-1-1) (Article 21)** : Vous pouvez demander le blocage de la journalisation pour votre IP. **Attention** : cela affectera tous les utilisateurs partageant cette IP et peut compromettre la sécurité du service.

**Alternative recommandée** :
Pour une suppression garantie de vos données :
1. Utilisez un VPN ou Tor pour masquer votre IP réelle lors de l'utilisation de l'API
2. Les logs existants seront automatiquement supprimés après **6 mois** maximum

**Contact** : Pour exercer ces droits malgré les limitations, contactez l'administrateur en fournissant le **maximum de détails** pour faciliter l'identification de vos requêtes :

**Informations essentielles à fournir :**
- 📍 **Adresse IP** : Votre IP actuelle (visible sur [whatismyip.com](https://www.whatismyip.com/))
- 📅 **Dates et heures** : Plage temporelle précise (ex: "du 5 au 8 décembre 2025, entre 14h et 17h")
- 🔍 **Endpoints utilisés** : URLs appelées (ex: `/medias?type=Télévision`, `/personnes/search?q=Bolloré`)
- 💻 **Outil/Client HTTP** : Navigateur (Chrome, Firefox), outil (curl, Postman, Python requests), bibliothèque, framework
- 🖥️ **Système d'exploitation** : Windows, macOS, Linux, Android, iOS avec version si possible
- 🌐 **Contexte réseau** : WiFi domestique, réseau d'entreprise, VPN (précisez le fournisseur), mobile (4G/5G)
- 📱 **Appareil** : Desktop, laptop, smartphone, tablette

**Exemple de demande bien détaillée :**
> "Je souhaite accéder à mes logs. IP actuelle : 203.0.113.42. J'ai utilisé l'API le 7 décembre 2025 entre 15h30 et 16h15 (heure de Paris) depuis mon bureau. J'ai effectué des recherches sur `/personnes/search?q=Lagardère` et consulté `/medias?type=Radio` via Firefox 133 sur Windows 10. Connexion via WiFi entreprise (possiblement partagée avec collègues)."

Plus vos informations sont précises, plus nous pourrons isoler vos requêtes parmi les logs, bien que nous ne puissions **jamais garantir à 100%** qu'il s'agit uniquement de vos données.

### Pourquoi l'identification par IP est problématique ?

**Méthodes insuffisantes pour prouver la propriété d'une IP :**

| Méthode | Pourquoi ce n'est pas suffisant |
|---------|----------------------------------|
| **"C'est mon IP actuelle"** | Votre IP a pu changer depuis les requêtes historiques (IP dynamique) |
| **Capture d'écran de `ipconfig`/`ifconfig`** | Peut être falsifiée, ne prouve pas l'usage passé |
| **Test en temps réel** | Prouve seulement l'IP actuelle, pas l'historique |
| **Attestation du FAI** | Coûteuse, complexe, et peut révéler d'autres utilisateurs du même réseau |
| **Logs de routeur personnel** | Peut être falsifiée, n'existe pas chez tous les utilisateurs |

**Cas où l'identification est encore plus impossible :**

- **Réseaux d'entreprise** : Des centaines d'employés partagent la même IP publique
- **VPN/Proxy** : Des milliers d'utilisateurs partagent les mêmes serveurs de sortie
- **Carrier-Grade NAT (CGNAT)** : Des FAI partagent une IP entre des centaines de clients
- **Wi-Fi public** : Café, bibliothèque, aéroport - identité impossible à établir
- **Tor** : Anonymisation par conception, identification impossible

**Conclusion juridique** : Dans un contexte d'API publique sans authentification, l'**Article 15 du RGPD (droit d'accès) est techniquement inexerçable de manière certaine**. Nous appliquons le principe de **"best effort"** : nous fournissons les logs de l'IP indiquée, mais ne pouvons garantir qu'ils correspondent uniquement au demandeur.

## Absence de partage avec des tiers

Les données collectées ne sont **jamais partagées** avec des tiers à des fins commerciales ou publicitaires.

## Contact

Pour toute question concernant cette politique de confidentialité, veuillez contacter l'administrateur de l'API.

## Ressources officielles et références légales

### Textes réglementaires

- **[Règlement (UE) 2016/679 (RGPD)](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679)** - Texte complet du Règlement Général sur la Protection des Données
- **[Loi Informatique et Libertés](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460)** - Loi n° 78-17 du 6 janvier 1978 modifiée

### Recommandations CNIL

- **[Recommandation sur la journalisation](https://www.cnil.fr/fr/la-cnil-publie-une-recommandation-relative-aux-mesures-de-journalisation)** - Durées de conservation des logs
- **[Les durées de conservation des données](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees)** - Guide pratique CNIL
- **[Guide RGPD](https://www.cnil.fr/fr/comprendre-le-rgpd)** - Comprendre le Règlement Général sur la Protection des Données

### Organismes de contrôle

- **[Commission Nationale de l'Informatique et des Libertés (CNIL)](https://www.cnil.fr)** - Autorité française de protection des données
- **[Comité Européen de la Protection des Données (CEPD)](https://edpb.europa.eu/edpb_fr)** - Lignes directrices européennes

---

*Dernière mise à jour : 2025-12-09*
*Conforme au RGPD (UE) 2016/679 et aux recommandations de la CNIL*
