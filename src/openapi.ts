// Base spec without servers - servers will be added dynamically
const baseSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Médias Français API',
    description:
      'API sur la propriété des médias français. Données issues du projet mdiplo/Medias_francais (Mise à jour en décembre 2024).\n\n' +
      '⚠️ **Confidentialité** : Cette API collecte des logs techniques (adresse IP, User-Agent, endpoints appelés) ' +
      'pour des raisons de sécurité, performance et diagnostic. Ces données sont stockées sur les serveurs de ' +
      '**Deno Land Inc** (société américaine basée à San Diego, CA) via Deno Deploy. ' +
      'Consultez [PRIVACY.md](https://github.com/cedric-famibelle-pronzola/medias-francais-api/blob/master/PRIVACY.md) pour plus de détails.',
    version: '1.3.0',
    contact: {
      name: 'API Support'
    },
    license: {
      name: 'AGPL-3.0',
      url: 'https://www.gnu.org/licenses/agpl-3.0.html'
    }
  },
  tags: [
    { name: 'Médias', description: 'Opérations sur les médias' },
    { name: 'Personnes', description: 'Opérations sur les personnes' },
    { name: 'Organisations', description: 'Opérations sur les organisations' },
    { name: 'Statistiques', description: 'Statistiques et analyses' },
    { name: 'Référentiels', description: 'Données de référence' }
  ],
  paths: {
    '/medias': {
      get: {
        tags: ['Médias'],
        summary: 'Liste des médias',
        description: 'Liste tous les médias avec pagination et filtres.',
        parameters: [
          {
            name: 'type',
            in: 'query',
            description: 'Filtrer par type',
            schema: {
              type: 'string',
              enum: ['Télévision', 'Radio', 'Presse', 'Site']
            }
          },
          {
            name: 'prix',
            in: 'query',
            description: 'Filtrer par prix',
            schema: { type: 'string', enum: ['Gratuit', 'Payant'] }
          },
          {
            name: 'echelle',
            in: 'query',
            description: 'Filtrer par échelle géographique',
            schema: {
              type: 'string',
              enum: ['National', 'Régional', 'Europe', 'Suisse']
            }
          },
          {
            name: 'disparu',
            in: 'query',
            description: 'Filtrer les médias disparus',
            schema: { type: 'boolean' }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Numéro de page',
            schema: { type: 'integer', default: 1, minimum: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Nombre de résultats par page',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Champ de tri',
            schema: {
              type: 'string',
              enum: ['nom', 'type', 'periodicite', 'echelle', 'prix']
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Ordre de tri',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
          }
        ],
        responses: {
          200: {
            description: 'Liste paginée des médias',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedMedias' }
              }
            }
          }
        }
      }
    },
    '/medias/search': {
      get: {
        tags: ['Médias'],
        summary: 'Recherche de médias',
        description:
          'Recherche de médias par nom. Utilisez extend=true pour obtenir toutes les informations (propriétaires, chaîne de propriétaires, etc.).',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            description: 'Terme de recherche (min 2 caractères)',
            schema: { type: 'string', minLength: 2 }
          },
          {
            name: 'extend',
            in: 'query',
            description:
              'Mode enrichi : retourne toutes les informations du média (défaut: false)',
            schema: { type: 'boolean', default: false }
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Champ de tri',
            schema: {
              type: 'string',
              enum: ['nom', 'type', 'periodicite', 'echelle', 'prix']
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Ordre de tri',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
          }
        ],
        responses: {
          200: {
            description: 'Résultats de recherche',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchResults' }
              }
            }
          },
          400: {
            description: 'Requête invalide',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/medias/{nom}': {
      get: {
        tags: ['Médias'],
        summary: "Détail d'un média",
        description: "Récupère les informations complètes d'un média.",
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: 'Nom du média (URL encoded)',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Détails du média',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MediaDetail' }
              }
            }
          },
          404: {
            description: 'Média non trouvé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/medias/{nom}/proprietaires': {
      get: {
        tags: ['Médias'],
        summary: "Propriétaires d'un média",
        description: "Liste des propriétaires directs d'un média.",
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: 'Nom du média',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Liste des propriétaires',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MediaProprietaires' }
              }
            }
          },
          404: {
            description: 'Média non trouvé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/medias/{nom}/proprietaires-ultimes': {
      get: {
        tags: ['Médias'],
        summary: "Propriétaires ultimes d'un média",
        description:
          "Chaîne de propriété complète jusqu'aux personnes physiques.",
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: 'Nom du média',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Chaîne de propriété',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MediaProprietairesUltimes'
                }
              }
            }
          },
          404: {
            description: 'Média non trouvé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/personnes': {
      get: {
        tags: ['Personnes'],
        summary: 'Liste des personnes',
        description: 'Liste toutes les personnes avec filtres.',
        parameters: [
          {
            name: 'forbes',
            in: 'query',
            description: 'Filtrer les milliardaires Forbes',
            schema: { type: 'boolean' }
          },
          {
            name: 'challenges_max',
            in: 'query',
            description: 'Rang maximum Challenges',
            schema: { type: 'integer' }
          },
          {
            name: 'annee',
            in: 'query',
            description: 'Année de référence',
            schema: { type: 'integer', enum: [2021, 2022, 2023, 2024] }
          },
          {
            name: 'has_medias',
            in: 'query',
            description: 'Possède au moins un média',
            schema: { type: 'boolean' }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Numéro de page',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Résultats par page',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Champ de tri',
            schema: {
              type: 'string',
              enum: [
                'nom',
                'nbMedias',
                'challenges2024',
                'challenges2023',
                'challenges2022',
                'challenges2021'
              ]
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Ordre de tri',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
          }
        ],
        responses: {
          200: {
            description: 'Liste paginée des personnes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedPersonnes' }
              }
            }
          }
        }
      }
    },
    '/personnes/top-challenges': {
      get: {
        tags: ['Personnes'],
        summary: 'Top Challenges',
        description: 'Classement des personnes les plus riches.',
        parameters: [
          {
            name: 'annee',
            in: 'query',
            description: 'Année du classement',
            schema: {
              type: 'integer',
              enum: [2021, 2022, 2023, 2024],
              default: 2024
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Nombre de résultats',
            schema: { type: 'integer', default: 10 }
          }
        ],
        responses: {
          200: {
            description: 'Classement',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TopChallenges' }
              }
            }
          }
        }
      }
    },
    '/personnes/{nom}': {
      get: {
        tags: ['Personnes'],
        summary: "Détail d'une personne",
        description: "Récupère les informations complètes d'une personne.",
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: 'Nom de la personne',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Détails de la personne',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PersonneDetail' }
              }
            }
          },
          404: {
            description: 'Personne non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/personnes/{nom}/medias': {
      get: {
        tags: ['Personnes'],
        summary: "Médias d'une personne",
        description:
          'Tous les médias détenus par une personne (directs et via organisations).',
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: 'Nom de la personne',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Médias détenus',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PersonneMedias' }
              }
            }
          },
          404: {
            description: 'Personne non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/personnes/{nom}/organisations': {
      get: {
        tags: ['Personnes'],
        summary: "Organisations d'une personne",
        description: 'Organisations contrôlées par une personne.',
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: 'Nom de la personne',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Organisations contrôlées',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PersonneOrganisations' }
              }
            }
          },
          404: {
            description: 'Personne non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/organisations': {
      get: {
        tags: ['Organisations'],
        summary: 'Liste des organisations',
        description: 'Liste toutes les organisations avec filtres.',
        parameters: [
          {
            name: 'has_medias',
            in: 'query',
            description: 'Possède au moins un média',
            schema: { type: 'boolean' }
          },
          {
            name: 'has_filiales',
            in: 'query',
            description: 'Possède au moins une filiale',
            schema: { type: 'boolean' }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Numéro de page',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Résultats par page',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Champ de tri',
            schema: {
              type: 'string',
              enum: ['nom', 'nbMedias', 'nbFiliales']
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Ordre de tri',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
          }
        ],
        responses: {
          200: {
            description: 'Liste paginée des organisations',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedOrganisations' }
              }
            }
          }
        }
      }
    },
    '/organisations/{nom}': {
      get: {
        tags: ['Organisations'],
        summary: "Détail d'une organisation",
        description: "Récupère les informations complètes d'une organisation.",
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: "Nom de l'organisation",
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: "Détails de l'organisation",
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrganisationDetail' }
              }
            }
          },
          404: {
            description: 'Organisation non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/organisations/{nom}/filiales': {
      get: {
        tags: ['Organisations'],
        summary: "Filiales d'une organisation",
        description: "Liste des filiales d'une organisation.",
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: "Nom de l'organisation",
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Liste des filiales',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrganisationFiliales' }
              }
            }
          },
          404: {
            description: 'Organisation non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/organisations/{nom}/medias': {
      get: {
        tags: ['Organisations'],
        summary: "Médias d'une organisation",
        description: 'Médias détenus directement par une organisation.',
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: "Nom de l'organisation",
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Médias détenus',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrganisationMedias' }
              }
            }
          },
          404: {
            description: 'Organisation non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/organisations/{nom}/hierarchie': {
      get: {
        tags: ['Organisations'],
        summary: "Hiérarchie d'une organisation",
        description:
          "Arbre complet de l'organisation : propriétaires parents et filiales enfants.",
        parameters: [
          {
            name: 'nom',
            in: 'path',
            required: true,
            description: "Nom de l'organisation",
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Hiérarchie complète',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrganisationHierarchie' }
              }
            }
          },
          404: {
            description: 'Organisation non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/stats': {
      get: {
        tags: ['Statistiques'],
        summary: 'Statistiques globales',
        description: 'Statistiques générales sur les données.',
        responses: {
          200: {
            description: 'Statistiques',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Stats' }
              }
            }
          }
        }
      }
    },
    '/stats/concentration': {
      get: {
        tags: ['Statistiques'],
        summary: 'Concentration des médias',
        description: 'Analyse de la concentration de la propriété des médias.',
        responses: {
          200: {
            description: 'Analyse de concentration',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Concentration' }
              }
            }
          }
        }
      }
    },
    '/types': {
      get: {
        tags: ['Référentiels'],
        summary: 'Types de médias',
        description: 'Liste des types de médias disponibles.',
        responses: {
          200: {
            description: 'Liste des types',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Types' }
              }
            }
          }
        }
      }
    },
    '/echelles': {
      get: {
        tags: ['Référentiels'],
        summary: 'Échelles géographiques',
        description: 'Liste des échelles géographiques.',
        responses: {
          200: {
            description: 'Liste des échelles',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Echelles' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' }
            }
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' }
        }
      },
      Proprietaire: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          type: { type: 'string', enum: ['personne', 'organisation'] },
          qualificatif: { type: 'string' },
          valeur: { type: 'string' }
        }
      },
      ProprietaireUltime: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          chemin: { type: 'array', items: { type: 'string' } },
          valeurFinale: { type: 'string' }
        }
      },
      MediaSummary: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          type: { type: 'string' },
          periodicite: { type: 'string' },
          echelle: { type: 'string' },
          prix: { type: 'string' },
          disparu: { type: 'boolean' },
          proprietaires: {
            type: 'array',
            items: { $ref: '#/components/schemas/Proprietaire' }
          },
          chaineProprietaires: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProprietaireUltime' }
          }
        }
      },
      MediaDetail: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          type: { type: 'string' },
          periodicite: { type: 'string' },
          echelle: { type: 'string' },
          prix: { type: 'string' },
          disparu: { type: 'boolean' },
          proprietaires: {
            type: 'array',
            items: { $ref: '#/components/schemas/Proprietaire' }
          },
          chaineProprietaires: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProprietaireUltime' }
          }
        }
      },
      PaginatedMedias: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/MediaSummary' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      SearchResults: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          count: {
            type: 'integer',
            description: 'Nombre de résultats trouvés'
          },
          results: {
            type: 'array',
            description:
              'Résultats : objets simples (nom, type) par défaut ou objets complets avec extend=true',
            items: {
              oneOf: [
                {
                  type: 'object',
                  description: 'Format simple (extend=false)',
                  properties: {
                    nom: { type: 'string' },
                    type: { type: 'string' }
                  }
                },
                {
                  $ref: '#/components/schemas/MediaSummary',
                  description: 'Format enrichi (extend=true)'
                }
              ]
            }
          }
        }
      },
      MediaProprietaires: {
        type: 'object',
        properties: {
          media: { type: 'string' },
          proprietaires: {
            type: 'array',
            items: { $ref: '#/components/schemas/Proprietaire' }
          }
        }
      },
      MediaProprietairesUltimes: {
        type: 'object',
        properties: {
          media: { type: 'string' },
          proprietairesUltimes: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProprietaireUltime' }
          }
        }
      },
      Classements: {
        type: 'object',
        properties: {
          challenges2024: { type: 'integer', nullable: true },
          forbes2024: { type: 'boolean' },
          challenges2023: { type: 'integer', nullable: true },
          forbes2023: { type: 'boolean' },
          challenges2022: { type: 'integer', nullable: true },
          forbes2022: { type: 'boolean' },
          challenges2021: { type: 'integer', nullable: true },
          forbes2021: { type: 'boolean' }
        }
      },
      MediaDetenu: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          type: { type: 'string' },
          qualificatif: { type: 'string' },
          valeur: { type: 'string' },
          via: { type: 'string' }
        }
      },
      PersonneSummary: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          classements: { $ref: '#/components/schemas/Classements' },
          mediasDirects: {
            type: 'array',
            items: { $ref: '#/components/schemas/MediaDetenu' }
          },
          mediasViaOrganisations: {
            type: 'array',
            items: { $ref: '#/components/schemas/MediaDetenu' }
          },
          organisations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                qualificatif: { type: 'string' },
                valeur: { type: 'string' }
              }
            }
          }
        }
      },
      PersonneDetail: {
        allOf: [{ $ref: '#/components/schemas/PersonneSummary' }]
      },
      PaginatedPersonnes: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/PersonneSummary' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      TopChallenges: {
        type: 'object',
        properties: {
          annee: { type: 'integer' },
          classement: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rang: { type: 'integer' },
                nom: { type: 'string' },
                forbes: { type: 'boolean' },
                nbMedias: { type: 'integer' }
              }
            }
          }
        }
      },
      PersonneMedias: {
        type: 'object',
        properties: {
          personne: { type: 'string' },
          mediasDirects: {
            type: 'array',
            items: { $ref: '#/components/schemas/MediaDetenu' }
          },
          mediasViaOrganisations: {
            type: 'array',
            items: { $ref: '#/components/schemas/MediaDetenu' }
          },
          total: { type: 'integer' }
        }
      },
      PersonneOrganisations: {
        type: 'object',
        properties: {
          personne: { type: 'string' },
          organisations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                qualificatif: { type: 'string' },
                valeur: { type: 'string' }
              }
            }
          }
        }
      },
      OrganisationSummary: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          commentaire: { type: 'string' },
          proprietaires: {
            type: 'array',
            items: { $ref: '#/components/schemas/Proprietaire' }
          },
          filiales: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                qualificatif: { type: 'string' },
                valeur: { type: 'string' }
              }
            }
          },
          medias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                type: { type: 'string' },
                qualificatif: { type: 'string' },
                valeur: { type: 'string' }
              }
            }
          }
        }
      },
      OrganisationDetail: {
        allOf: [{ $ref: '#/components/schemas/OrganisationSummary' }]
      },
      PaginatedOrganisations: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrganisationSummary' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      OrganisationFiliales: {
        type: 'object',
        properties: {
          organisation: { type: 'string' },
          filiales: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                qualificatif: { type: 'string' },
                valeur: { type: 'string' }
              }
            }
          }
        }
      },
      OrganisationMedias: {
        type: 'object',
        properties: {
          organisation: { type: 'string' },
          medias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                type: { type: 'string' },
                qualificatif: { type: 'string' },
                valeur: { type: 'string' }
              }
            }
          }
        }
      },
      OrganisationHierarchie: {
        type: 'object',
        properties: {
          organisation: { type: 'string' },
          parents: {
            type: 'array',
            items: { $ref: '#/components/schemas/Proprietaire' }
          },
          enfants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                qualificatif: { type: 'string' },
                valeur: { type: 'string' }
              }
            }
          }
        }
      },
      Stats: {
        type: 'object',
        properties: {
          totaux: {
            type: 'object',
            properties: {
              medias: { type: 'integer' },
              personnes: { type: 'integer' },
              organisations: { type: 'integer' }
            }
          },
          mediasParType: {
            type: 'object',
            additionalProperties: { type: 'integer' }
          },
          mediasParPrix: {
            type: 'object',
            additionalProperties: { type: 'integer' }
          },
          mediasDisparus: { type: 'integer' }
        }
      },
      Concentration: {
        type: 'object',
        properties: {
          parPersonnes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                nbMedias: { type: 'integer' }
              }
            }
          },
          parOrganisations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                nbMedias: { type: 'integer' }
              }
            }
          }
        }
      },
      Types: {
        type: 'object',
        properties: {
          types: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      Echelles: {
        type: 'object',
        properties: {
          echelles: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  }
};

// Generate OpenAPI spec with dynamic server URL
export function getOpenApiSpec(baseUrl: string) {
  const apiBasePath = Deno.env.get('API_BASE_PATH') || '/api';

  return {
    ...baseSpec,
    servers: [
      {
        url: `${baseUrl}${apiBasePath}`,
        description: baseUrl.includes('localhost')
          ? 'Serveur de développement'
          : 'Serveur de production'
      }
    ]
  };
}
