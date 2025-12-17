// Custom error classes for better error handling

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, public resource?: string) {
    super(message, 404, 'NOT_FOUND', { resource });
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

export class IPBlockedError extends ApiError {
  constructor(
    message: string,
    public blockInfo: {
      reason: string;
      source: 'system' | 'admin';
      expiresAt?: Date | null;
    }
  ) {
    super(message, 403, 'IP_BLOCKED', blockInfo);
    this.name = 'IPBlockedError';
  }
}
