import { getPersonnes, PersonneEnrichie } from '../data/index.ts';

export interface PersonneFilters {
  forbes?: boolean;
  challengesMax?: number;
  annee?: number;
  hasMedias?: boolean;
}

export interface SortParams {
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

type AnneeKey = 2021 | 2022 | 2023 | 2024;

export const personnesService = {
  all(
    filters: PersonneFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 },
    sorting: SortParams = {}
  ): PaginatedResult<PersonneEnrichie> {
    let result = getPersonnes();
    const annee = (filters.annee || 2024) as AnneeKey;

    // Apply filters
    if (filters.forbes) {
      const forbesKey =
        `forbes${annee}` as keyof PersonneEnrichie['classements'];
      result = result.filter((p) => p.classements[forbesKey] === true);
    }

    if (filters.challengesMax) {
      const challengesKey =
        `challenges${annee}` as keyof PersonneEnrichie['classements'];
      result = result.filter((p) => {
        const rang = p.classements[challengesKey] as number | null;
        return rang !== null && rang <= filters.challengesMax!;
      });
    }

    if (filters.hasMedias) {
      result = result.filter(
        (p) => p.mediasDirects.length > 0 || p.mediasViaOrganisations.length > 0
      );
    }

    // Apply sorting
    if (sorting.sort) {
      const order = sorting.order === 'desc' ? -1 : 1;
      result = [...result].sort((a, b) => {
        let aVal: string | number | boolean | null = null;
        let bVal: string | number | boolean | null = null;

        if (sorting.sort === 'nom') {
          aVal = a.nom;
          bVal = b.nom;
        } else if (sorting.sort === 'nbMedias') {
          aVal = a.mediasDirects.length + a.mediasViaOrganisations.length;
          bVal = b.mediasDirects.length + b.mediasViaOrganisations.length;
        } else if (sorting.sort?.startsWith('challenges')) {
          const key = sorting.sort as keyof PersonneEnrichie['classements'];
          aVal = a.classements[key] as number | null;
          bVal = b.classements[key] as number | null;
        }

        if (aVal === null) return 1;
        if (bVal === null) return -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal, 'fr') * order;
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * order;
        }
        return 0;
      });
    }

    // Pagination
    const total = result.length;
    const pages = Math.ceil(total / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;

    return {
      data: result.slice(start, end),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages
      }
    };
  },

  findByNom(nom: string): PersonneEnrichie | undefined {
    return getPersonnes().find(
      (p) => p.nom.toLowerCase() === nom.toLowerCase()
    );
  },

  topChallenges(
    annee: AnneeKey = 2024,
    limit: number = 10
  ): {
    rang: number;
    nom: string;
    forbes: boolean;
    nbMedias: number;
  }[] {
    const challengesKey =
      `challenges${annee}` as keyof PersonneEnrichie['classements'];
    const forbesKey = `forbes${annee}` as keyof PersonneEnrichie['classements'];

    return getPersonnes()
      .filter((p) => p.classements[challengesKey] !== null)
      .sort((a, b) => {
        const rangA = a.classements[challengesKey] as number;
        const rangB = b.classements[challengesKey] as number;
        return rangA - rangB;
      })
      .slice(0, limit)
      .map((p) => ({
        rang: p.classements[challengesKey] as number,
        nom: p.nom,
        forbes: p.classements[forbesKey] as boolean,
        nbMedias: p.mediasDirects.length + p.mediasViaOrganisations.length
      }));
  }
};
