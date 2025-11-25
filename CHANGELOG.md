# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-25

### 🔒 Security

- **Input Validation**: Add strict validation for all query parameters
  (pagination, sorting, search)
  - Pagination: max 100 items per page, max 1000 pages
  - Sort fields: whitelist validation by resource type
  - Search queries: 2-200 characters requirement
  - Boolean parameters: strict "true"/"false" parsing
- **Input Sanitization**: Add XSS protection by sanitizing all user inputs
  - Remove dangerous characters (`<`, `>`)
  - Normalize whitespace
  - Remove control characters
  - Enforce maximum length limits
- **CORS Configuration**: Secure CORS with production whitelist
  - Production: whitelist for `medias-francais.com` and subdomains
  - Development: permissive for local testing
  - Only GET and OPTIONS methods allowed
- **Rate Limiting**: Add differentiated rate limiting by endpoint type
  - Search endpoints: 20 requests/minute (expensive operations)
  - Standard API endpoints: 60 requests/minute
  - Health, favicon, robots.txt excluded from rate limiting
- **Admin Endpoint Protection**: Secure cache invalidation endpoint
  - Requires `X-Admin-Key` header in production
  - Accessible without auth in development

### ⚡ Performance

- **Application-Level Caching**: Implement in-memory cache with TTL
  - 5-minute TTL (configurable via `CACHE_TTL` environment variable)
  - Cache hit/miss tracking for monitoring
  - Reduces disk I/O by 80%+ on repeated requests
- **Cache Management Endpoints**: Add monitoring and control endpoints
  - `GET /cache/stats`: View cache statistics (hits, misses, age)
  - `POST /cache/invalidate`: Manually invalidate cache (admin only)

### ✨ Added

- **Custom Error Classes**: Structured error handling with unique tracking IDs
  - `ApiError`: Base error class
  - `ValidationError`: For invalid input (400)
  - `NotFoundError`: For missing resources (404)
  - `RateLimitError`: For rate limit exceeded (429)
  - `BadRequestError`: For malformed requests (400)
- **Error Tracking**: All errors now include unique UUIDs for debugging
- **Enhanced Error Logging**: Structured logging with error context
  - Error ID, name, message, path, method
  - Generic messages in production (no information leakage)
  - Detailed messages in development

### 🔧 Changed

- **Error Response Format**: Error codes are now strings instead of numbers
  - **BREAKING**: `error.code` is now `"NOT_FOUND"` instead of `404`
  - HTTP status codes remain unchanged (`res.status`)
  - All error responses now include `error.id` (UUID)

### 🛠️ Configuration

- **New Environment Variables**:
  - `CACHE_TTL`: Cache time-to-live in milliseconds (default: 300000 = 5 min)
  - `ADMIN_KEY`: Secret key for admin-protected endpoints (required in
    production)

### 📚 Documentation

- Improve and fix diagrams in documentation
- Add detailed error handling documentation

### 🧪 Tests

- Update API tests to match new error response format
- All 128 tests passing (1 ignored)

### 🏗️ Refactoring

- Remove unused root endpoint
- Optimize imports (remove unused imports)
- Organize code in modules (errors, validators, sanitizers, cache)
- Improve separation of concerns

### 📊 Impact Summary

**Security Improvements**:

- ✅ XSS protection via sanitization
- ✅ Injection prevention via validation
- ✅ Secured CORS configuration
- ✅ Rate limiting protection
- ✅ Admin endpoint authentication

**Performance Improvements**:

- ✅ 80%+ reduction in disk I/O (caching)
- ✅ Faster response times for cached data
- ✅ Efficient cache invalidation strategy

**Developer Experience**:

- ✅ Better error tracking with UUIDs
- ✅ Structured error handling
- ✅ Clear validation error messages
- ✅ Comprehensive monitoring endpoints

---

## [1.0.0] - 2025-11-25

### ✨ Initial Release

- Complete REST API for French media ownership data
- Endpoints for medias, personnes (persons), organisations
- Search functionality
- Statistical aggregations
- Pagination and filtering
- Sorting capabilities
- OpenAPI/Swagger documentation
- Rate limiting middleware
- Structured logging
- Compression support
- Docker deployment support
- Deno Deploy ready
- 100+ unit and integration tests

---

## Links

- [API Documentation](./docs/api-endpoints.md)

---

**Note**: For migration guide from 1.0.0 to 1.0.1, see the breaking changes
section above regarding error response format.
