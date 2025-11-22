import {
  MediaEnrichi,
  OrganisationEnrichie,
  PersonneEnrichie
} from '../src/data/index.ts';

// Mock data for testing
export const mockMedias: MediaEnrichi[] = [
  {
    nom: 'Le Monde',
    type: 'Presse (généraliste  politique  économique)',
    periodicite: 'Quotidien',
    echelle: 'National',
    prix: 'Payant',
    disparu: false,
    proprietaires: [
      {
        nom: 'Le Monde libre',
        type: 'organisation',
        qualificatif: 'égal à',
        valeur: '100.00%'
      }
    ],
    chaineProprietaires: [
      {
        nom: 'Xavier Niel',
        chemin: ['Xavier Niel', 'NJJ Presse', 'Le Monde libre'],
        valeurFinale: '28.00%'
      }
    ]
  },
  {
    nom: 'BFM TV',
    type: 'Télévision',
    periodicite: '',
    echelle: 'National',
    prix: 'Gratuit',
    disparu: false,
    proprietaires: [
      {
        nom: 'Altice Média',
        type: 'organisation',
        qualificatif: 'égal à',
        valeur: '100.00%'
      }
    ],
    chaineProprietaires: [
      {
        nom: 'Patrick Drahi',
        chemin: ['Patrick Drahi', 'Altice', 'Altice Média'],
        valeurFinale: '100.00%'
      }
    ]
  },
  {
    nom: 'France Inter',
    type: 'Radio',
    periodicite: '',
    echelle: 'National',
    prix: 'Gratuit',
    disparu: false,
    proprietaires: [
      {
        nom: 'Radio France',
        type: 'organisation',
        qualificatif: 'égal à',
        valeur: '100.00%'
      }
    ],
    chaineProprietaires: []
  },
  {
    nom: 'La Cinq',
    type: 'Télévision',
    periodicite: '',
    echelle: 'National',
    prix: 'Gratuit',
    disparu: true,
    proprietaires: [],
    chaineProprietaires: []
  },
  {
    nom: 'Tribune de Genève',
    type: 'Presse (généraliste  politique  économique)',
    periodicite: 'Quotidien',
    echelle: 'Suisse',
    prix: 'Payant',
    disparu: false,
    proprietaires: [],
    chaineProprietaires: []
  }
];

export const mockPersonnes: PersonneEnrichie[] = [
  {
    nom: 'Bernard Arnault',
    classements: {
      challenges2024: 1,
      forbes2024: true,
      challenges2023: 1,
      forbes2023: true,
      challenges2022: 1,
      forbes2022: true,
      challenges2021: 1,
      forbes2021: true
    },
    mediasDirects: [],
    mediasViaOrganisations: [
      {
        nom: 'Les Echos',
        type: 'Presse (généraliste  politique  économique)',
        qualificatif: 'égal à',
        valeur: '100.00%',
        via: 'LVMH'
      }
    ],
    organisations: [
      {
        nom: 'LVMH',
        qualificatif: 'égal à',
        valeur: '48.00%'
      }
    ]
  },
  {
    nom: 'Xavier Niel',
    classements: {
      challenges2024: 8,
      forbes2024: true,
      challenges2023: 7,
      forbes2023: true,
      challenges2022: 6,
      forbes2022: true,
      challenges2021: 7,
      forbes2021: true
    },
    mediasDirects: [],
    mediasViaOrganisations: [
      {
        nom: 'Le Monde',
        type: 'Presse (généraliste  politique  économique)',
        qualificatif: 'égal à',
        valeur: '28.00%',
        via: 'NJJ Presse → Le Monde libre'
      }
    ],
    organisations: [
      {
        nom: 'NJJ Presse',
        qualificatif: 'égal à',
        valeur: '100.00%'
      }
    ]
  },
  {
    nom: 'Patrick Drahi',
    classements: {
      challenges2024: 15,
      forbes2024: false,
      challenges2023: 12,
      forbes2023: true,
      challenges2022: 10,
      forbes2022: true,
      challenges2021: 11,
      forbes2021: true
    },
    mediasDirects: [],
    mediasViaOrganisations: [
      {
        nom: 'BFM TV',
        type: 'Télévision',
        qualificatif: 'égal à',
        valeur: '100.00%',
        via: 'Altice → Altice Média'
      }
    ],
    organisations: [
      {
        nom: 'Altice',
        qualificatif: 'égal à',
        valeur: '92.00%'
      }
    ]
  },
  {
    nom: 'Personne Sans Media',
    classements: {
      challenges2024: 50,
      forbes2024: false,
      challenges2023: null,
      forbes2023: false,
      challenges2022: null,
      forbes2022: false,
      challenges2021: null,
      forbes2021: false
    },
    mediasDirects: [],
    mediasViaOrganisations: [],
    organisations: []
  }
];

export const mockOrganisations: OrganisationEnrichie[] = [
  {
    nom: 'Vivendi',
    commentaire: '',
    proprietaires: [
      {
        nom: 'Bolloré',
        type: 'organisation',
        qualificatif: 'égal à',
        valeur: '27.00%'
      }
    ],
    filiales: [
      {
        nom: 'Canal+ Group',
        qualificatif: 'égal à',
        valeur: '100.00%'
      }
    ],
    medias: [
      {
        nom: 'Canal +',
        type: 'Télévision',
        qualificatif: 'égal à',
        valeur: '100.00%'
      }
    ]
  },
  {
    nom: 'Le Monde libre',
    commentaire: '',
    proprietaires: [
      {
        nom: 'NJJ Presse',
        type: 'organisation',
        qualificatif: 'égal à',
        valeur: '28.00%'
      }
    ],
    filiales: [],
    medias: [
      {
        nom: 'Le Monde',
        type: 'Presse (généraliste  politique  économique)',
        qualificatif: 'égal à',
        valeur: '100.00%'
      }
    ]
  },
  {
    nom: 'Organisation Sans Media',
    commentaire: 'Test organisation',
    proprietaires: [],
    filiales: [],
    medias: []
  }
];
