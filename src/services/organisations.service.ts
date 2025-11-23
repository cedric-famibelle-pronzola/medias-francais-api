import { getOrganisations, OrganisationEnrichie } from '../data/index.ts';

export interface OrganisationFilters {
  hasMedias?: boolean;
  hasFiliales?: boolean;
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

export const organisationsService = {
  all(
    filters: OrganisationFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 },
    sorting: SortParams = {}
  ): PaginatedResult<OrganisationEnrichie> {
    let result = getOrganisations();

    // Apply filters
    if (filters.hasMedias) {
      result = result.filter((o) => o.medias.length > 0);
    }

    if (filters.hasFiliales) {
      result = result.filter((o) => o.filiales.length > 0);
    }

    // Apply sorting
    if (sorting.sort) {
      const order = sorting.order === 'desc' ? -1 : 1;
      result = [...result].sort((a, b) => {
        let aVal: string | number | null = null;
        let bVal: string | number | null = null;

        if (sorting.sort === 'nom') {
          aVal = a.nom;
          bVal = b.nom;
        } else if (sorting.sort === 'nbMedias') {
          aVal = a.medias.length;
          bVal = b.medias.length;
        } else if (sorting.sort === 'nbFiliales') {
          aVal = a.filiales.length;
          bVal = b.filiales.length;
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

  findByNom(nom: string): OrganisationEnrichie | undefined {
    return getOrganisations().find(
      (o) => o.nom.toLowerCase() === nom.toLowerCase()
    );
  }
};
