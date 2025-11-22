import { getOrganisations, OrganisationEnrichie } from '../data/index.ts';

export interface OrganisationFilters {
  hasMedias?: boolean;
  hasFiliales?: boolean;
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
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): PaginatedResult<OrganisationEnrichie> {
    let result = getOrganisations();

    // Apply filters
    if (filters.hasMedias) {
      result = result.filter((o) => o.medias.length > 0);
    }

    if (filters.hasFiliales) {
      result = result.filter((o) => o.filiales.length > 0);
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
