// Types
export interface Proprietaire {
  nom: string;
  type: 'personne' | 'organisation';
  qualificatif: string;
  valeur: string;
}

export interface ProprietaireUltime {
  nom: string;
  chemin: string[];
  valeurFinale: string;
}

export interface MediaEnrichi {
  nom: string;
  type: string;
  periodicite: string;
  echelle: string;
  prix: string;
  disparu: boolean;
  proprietaires: Proprietaire[];
  chaineProprietaires: ProprietaireUltime[];
}

export interface MediaDetenu {
  nom: string;
  type: string;
  qualificatif: string;
  valeur: string;
  via?: string;
}

export interface PersonneEnrichie {
  nom: string;
  classements: {
    challenges2024: number | null;
    forbes2024: boolean;
    challenges2023: number | null;
    forbes2023: boolean;
    challenges2022: number | null;
    forbes2022: boolean;
    challenges2021: number | null;
    forbes2021: boolean;
  };
  mediasDirects: MediaDetenu[];
  mediasViaOrganisations: MediaDetenu[];
  organisations: {
    nom: string;
    qualificatif: string;
    valeur: string;
  }[];
}

export interface OrganisationEnrichie {
  nom: string;
  commentaire: string;
  proprietaires: Proprietaire[];
  filiales: {
    nom: string;
    qualificatif: string;
    valeur: string;
  }[];
  medias: {
    nom: string;
    type: string;
    qualificatif: string;
    valeur: string;
  }[];
}

// Data store
let medias: MediaEnrichi[] = [];
let personnes: PersonneEnrichie[] = [];
let organisations: OrganisationEnrichie[] = [];

// Load data from JSON files
export async function loadData(): Promise<void> {
  const [mediasData, personnesData, organisationsData] = await Promise.all([
    Deno.readTextFile('dist/enriched/medias.json'),
    Deno.readTextFile('dist/enriched/personnes.json'),
    Deno.readTextFile('dist/enriched/organisations.json')
  ]);

  medias = JSON.parse(mediasData);
  personnes = JSON.parse(personnesData);
  organisations = JSON.parse(organisationsData);
}

// Data accessors
export function getMedias(): MediaEnrichi[] {
  return medias;
}

export function getPersonnes(): PersonneEnrichie[] {
  return personnes;
}

export function getOrganisations(): OrganisationEnrichie[] {
  return organisations;
}

// Test helpers - set mock data for testing
export function setTestData(
  mediasData: MediaEnrichi[],
  personnesData: PersonneEnrichie[],
  organisationsData: OrganisationEnrichie[]
): void {
  medias = mediasData;
  personnes = personnesData;
  organisations = organisationsData;
}

// Clear all data (useful for test cleanup)
export function clearData(): void {
  medias = [];
  personnes = [];
  organisations = [];
}
