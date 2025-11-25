import { ValidationError } from '../errors.ts';

// Pagination validation
export interface PaginationResult {
  page: number;
  limit: number;
}

export function validatePagination(
  pageStr?: string,
  limitStr?: string
): PaginationResult {
  const page = parseInt(pageStr || '1');
  const limit = parseInt(limitStr || '20');

  if (isNaN(page) || page < 1) {
    throw new ValidationError('Page must be a positive integer >= 1', 'page');
  }

  if (isNaN(limit) || limit < 1) {
    throw new ValidationError('Limit must be a positive integer >= 1', 'limit');
  }

  if (limit > 100) {
    throw new ValidationError('Limit cannot exceed 100', 'limit');
  }

  // Limit max page to prevent abuse
  if (page > 1000) {
    throw new ValidationError('Page cannot exceed 1000', 'page');
  }

  return { page, limit };
}

// Sort field validation
const ALLOWED_SORT_FIELDS = {
  medias: ['nom', 'type', 'prix', 'echelle'],
  personnes: ['nom', 'challenges2024', 'forbes', 'nbMedias'],
  organisations: ['nom', 'nbMedias', 'nbFiliales']
};

export function validateSort(
  sort: string | undefined,
  resource: keyof typeof ALLOWED_SORT_FIELDS
): string | undefined {
  if (!sort) return undefined;

  const allowedFields = ALLOWED_SORT_FIELDS[resource];
  if (!allowedFields.includes(sort)) {
    throw new ValidationError(
      `Invalid sort field. Allowed: ${allowedFields.join(', ')}`,
      'sort'
    );
  }

  return sort;
}

// Order validation
export function validateOrder(
  order: string | undefined
): 'asc' | 'desc' | undefined {
  if (!order) return undefined;

  if (order !== 'asc' && order !== 'desc') {
    throw new ValidationError('Order must be either "asc" or "desc"', 'order');
  }

  return order;
}

// Search query validation
export function validateSearchQuery(query: string | undefined): string {
  if (!query) {
    throw new ValidationError('Query parameter "q" is required', 'q');
  }

  if (query.length < 2) {
    throw new ValidationError(
      'Query must be at least 2 characters long',
      'q'
    );
  }

  if (query.length > 200) {
    throw new ValidationError('Query cannot exceed 200 characters', 'q');
  }

  return query;
}

// Boolean validation
export function validateBoolean(
  value: string | undefined
): boolean | undefined {
  if (value === undefined) return undefined;

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new ValidationError(
    'Boolean value must be either "true" or "false"',
    'boolean'
  );
}
