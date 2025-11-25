// Sanitization utilities to prevent XSS and injection attacks

/**
 * Sanitize a string input
 * - Trims whitespace
 * - Removes dangerous characters (< >)
 * - Normalizes whitespace
 * - Enforces max length
 */
export function sanitizeString(
  input: string | undefined,
  maxLength = 200
): string {
  if (!input) return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
}

/**
 * Sanitize a URL parameter that will be used as a resource name
 */
export function sanitizeResourceName(name: string): string {
  // Decode URI component first
  const decoded = decodeURIComponent(name);

  // Sanitize and limit length
  return sanitizeString(decoded, 300);
}

/**
 * Sanitize query string for search
 */
export function sanitizeSearchQuery(query: string): string {
  return sanitizeString(query, 200);
}

/**
 * Remove null bytes and control characters
 */
export function removeControlCharacters(input: string): string {
  // Remove null bytes and other control characters except tab, newline, carriage return
  // deno-lint-ignore no-control-regex
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}
