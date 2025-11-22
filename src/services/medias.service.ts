import { getMedias, MediaEnrichi } from '../data/index.ts';

export interface MediaFilters {
  type?: string;
  prix?: string;
  echelle?: string;
  disparu?: boolean;
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

export const mediasService = {
  all(
    filters: MediaFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): PaginatedResult<MediaEnrichi> {
    let result = getMedias();

    // Apply filters
    if (filters.type) {
      result = result.filter((m) =>
        m.type.toLowerCase().includes(filters.type!.toLowerCase())
      );
    }
    if (filters.prix) {
      result = result.filter(
        (m) => m.prix.toLowerCase() === filters.prix!.toLowerCase()
      );
    }
    if (filters.echelle) {
      result = result.filter(
        (m) => m.echelle.toLowerCase() === filters.echelle!.toLowerCase()
      );
    }
    if (filters.disparu !== undefined) {
      result = result.filter((m) => m.disparu === filters.disparu);
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

  findByNom(nom: string): MediaEnrichi | undefined {
    return getMedias().find(
      (m) => m.nom.toLowerCase() === nom.toLowerCase()
    );
  },

  search(query: string): MediaEnrichi[] {
    const q = query.toLowerCase();
    return getMedias().filter((m) => m.nom.toLowerCase().includes(q));
  },

  getTypes(): string[] {
    const types = new Set(getMedias().map((m) => m.type).filter(Boolean));
    return [...types].sort();
  },

  getEchelles(): string[] {
    const echelles = new Set(getMedias().map((m) => m.echelle).filter(Boolean));
    return [...echelles].sort();
  }
};
