import { getMedias, MediaEnrichi } from '../data/index.ts';

export interface MediaFilters {
  type?: string;
  prix?: string;
  echelle?: string;
  disparu?: boolean;
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

export const mediasService = {
  all(
    filters: MediaFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 },
    sorting: SortParams = {}
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

    // Apply sorting
    if (sorting.sort) {
      const order = sorting.order === 'desc' ? -1 : 1;
      result = [...result].sort((a, b) => {
        const aVal = a[sorting.sort as keyof MediaEnrichi];
        const bVal = b[sorting.sort as keyof MediaEnrichi];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal, 'fr') * order;
        }
        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          return (aVal === bVal ? 0 : aVal ? -1 : 1) * order;
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

  findByNom(nom: string): MediaEnrichi | undefined {
    return getMedias().find(
      (m) => m.nom.toLowerCase() === nom.toLowerCase()
    );
  },

  search(
    query: string,
    extend = false
  ): MediaEnrichi[] | Array<{ nom: string; type: string }> {
    const q = query.toLowerCase();
    const results = getMedias().filter((m) => m.nom.toLowerCase().includes(q));

    if (extend) {
      return results; // Return full MediaEnrichi objects
    }

    return results.map((m) => ({ nom: m.nom, type: m.type })); // Return simplified
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
