# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-12-18

### ✨ Added

- **IP Blocking System**: Complete infrastructure for access control
  - `BlockedIP` and `WhitelistedIP` type definitions with metadata support
  - `IPBlockingAdapter` interface for extensible storage backends
  - Factory pattern with auto-detection (Memory, DuckDB, PostgreSQL)
  - Middleware chain integration: Security → Logger → CORS → **IP Blocking** → Rate Limiter → Routes

- **Storage Adapters**:
  - **Memory Adapter**: In-memory storage for development and testing
  - **DuckDB Adapter**: File-based storage (`logs/ip_blocking.db`) for single-instance deployments
  - **PostgreSQL Adapter**: Production-ready with INET type for multi-instance support
    - Connection pooling (max 10 connections)
    - Automatic table creation with indexes
    - Native IP validation and storage

- **Admin API** (`/admin/ip-blocking`): 9 endpoints with X-Admin-Key authentication
  - `POST /block`: Block an IP (temporary or permanent)
  - `DELETE /unblock/:ip`: Unblock an IP
  - `GET /list`: List blocked IPs with optional expired filter
  - `POST /whitelist/add`: Add IP to whitelist
  - `DELETE /whitelist/remove/:ip`: Remove IP from whitelist
  - `GET /whitelist`: List whitelisted IPs
  - `POST /cleanup`: Clean expired blocks
  - `GET /stats`: Get blocking statistics
  - `GET /check/:ip`: Check IP status

- **Auto-Blocking**: Integration with rate limiter
  - Configurable threshold (`AUTO_BLOCK_THRESHOLD`, default: 10 violations)
  - Configurable duration (`AUTO_BLOCK_DURATION`, default: 60 minutes)
  - Whitelist bypass protection
  - Metadata tracking (violations count, endpoint, user-agent)

- **Whitelist System**:
  - Priority checking (whitelisted IPs always allowed)
  - Environment variable configuration (`IP_BLOCKING_WHITELIST`)
  - Automatic loading at startup (127.0.0.1, ::1)
  - Protection against accidental blocking

- **Fail-Safe Strategies**:
  - Fail-open by default (allow if DB unavailable)
  - Configurable fail-closed mode (`IP_BLOCKING_FAIL_CLOSED=true`)
  - Graceful error handling

- **Enhanced Error Handling**:
  - `IPBlockedError` custom error class with block details
  - `Retry-After` header for temporary blocks
  - Detailed error responses with unique error IDs

- **IP Detection & Normalization**:
  - Multi-header support (x-forwarded-for, x-real-ip, cf-connecting-ip)
  - IPv4-mapped IPv6 conversion (`::ffff:192.168.1.1` → `192.168.1.1`)
  - Leading zeros removal for IPv4
  - Zone ID removal for IPv6

- **Comprehensive Documentation** (`docs/ip-blocking.md`, 768 lines):
  - Architecture diagrams and flow charts
  - Complete configuration guide
  - All 9 API endpoints with curl examples
  - PostgreSQL schema with INET types
  - Security best practices
  - FAQ and troubleshooting

### 🔧 Changed

- **Rate Limiter**: Enhanced with auto-blocking capability
  - Tracks violations per IP
  - Triggers blocking when threshold exceeded
  - Logs blocking events

- **Middleware Order**: Added IP blocking before rate limiter for better security

### 🐛 Fixed

- **IPv4-mapped IPv6 Matching**: Fixed blocking not working when proxies send IPs in `::ffff:x.x.x.x` format
- **PostgreSQL Type**: Migrated from CIDR to INET for simpler IP storage and comparison
- **IP Validation**: Extracted helper function to eliminate duplication across admin endpoints

### 🛠️ Configuration

- **New Environment Variables**:
  - `IP_BLOCKING_STORAGE`: Backend selection (`auto`, `memory`, `duckdb`, `postgres`)
  - `IP_BLOCKING_DATABASE_URL`: PostgreSQL URL for IP blocking (fallback: `DATABASE_URL`)
  - `IP_BLOCKING_WHITELIST`: Comma-separated list of whitelisted IPs
  - `IP_BLOCKING_FAIL_CLOSED`: Enable fail-closed strategy (default: false)
  - `AUTO_BLOCK_ENABLED`: Enable auto-blocking from rate limiter (default: false)
  - `AUTO_BLOCK_THRESHOLD`: Violations before auto-block (default: 10)
  - `AUTO_BLOCK_DURATION`: Block duration in minutes (default: 60)
  - `ADMIN_KEY`: API key for admin endpoints (required in production)

### 📦 Database Schema

```sql
-- PostgreSQL tables (auto-created)
CREATE TABLE blocked_ips (
  ip INET NOT NULL PRIMARY KEY,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  source VARCHAR(10) NOT NULL CHECK (source IN ('system', 'admin')),
  blocked_by_ip INET,
  blocked_by_identifier VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE whitelisted_ips (
  ip INET NOT NULL PRIMARY KEY,
  added_at TIMESTAMPTZ NOT NULL,
  added_by_ip INET,
  added_by_identifier VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocked_ips_expires_at
ON blocked_ips(expires_at) WHERE expires_at IS NOT NULL;
```

### 🧪 Tests

- All 145 tests passing with new IP blocking functionality

### 📚 Documentation

- Complete IP blocking documentation (768 lines)
- Updated README with IP blocking section
- Architecture diagrams and configuration examples
- Security best practices and GDPR considerations

### 🔒 Security

- ✅ Anti-self-block protection (admins can't block their own IP)
- ✅ Whitelist priority (protected IPs never blocked)
- ✅ Admin API authentication (X-Admin-Key header)
- ✅ Fail-safe strategies (configurable behavior on DB errors)
- ✅ IPv4-mapped IPv6 normalization (consistent blocking across proxy formats)

---

## [1.2.0] - 2025-12-10

### ✨ Added

- **Structured Logging System**: Complete logging infrastructure with
  multi-backend support
  - `LogEntry` type definition with timestamp, level, method, path, query,
    status, duration, IP, User-Agent, request ID, referer
  - `LogAdapter` interface for extensible storage backends
  - Factory pattern with auto-detection based on environment variables
  - Non-blocking log insertion (errors don't affect HTTP responses)

- **DuckDB Backend**: File-based and in-memory storage for local/self-hosted
  environments
  - File mode: `logs/access_logs.db` for persistent storage
  - Memory mode: `":memory:"` for ephemeral usage
  - JSON column storage structure
  - Perfect for development and VPS deployments
  - Not compatible with Deno Deploy (requires persistent file system)

- **PostgreSQL Backend**: Network-based storage for all environments
  - Compatible with local, VPS, and Deno Deploy
  - Typed columns with indexes (timestamp, status, path, request_id)
  - External database support (Neon.tech, Supabase, AWS RDS, etc.)
  - Production setup: Neon.tech on AWS eu-central-1 (Germany)

- **Enhanced Log Data**: Additional fields for better observability
  - Query parameters (`?type=Télévision&limit=20`)
  - Referer header (origin page URL)
  - Request ID (8-character unique identifier in `X-Request-ID` header)

- **GDPR-Compliant Privacy Policy** (`PRIVACY.md`):
  - Complete data collection disclosure with real examples
  - Legal justification (GDPR Articles 6.1.f and 6.1.c)
  - 6-month retention period (CNIL recommendation)
  - User rights (access, rectification, deletion, opposition) with limitations
    explained
  - International data transfers transparency (Deno Deploy, Neon.tech)
  - Detailed contact requirements for rights exercise
  - IP ownership impossibility explanation

- **Comprehensive Documentation** (`docs/logging.md`):
  - Mermaid architecture diagram
  - Configuration for each environment (local dev, self-hosted production, Deno
    Deploy)
  - SQL query examples for both DuckDB and PostgreSQL
  - Troubleshooting guide
  - Technical nuances (DuckDB memory vs file, FFI on Deno Deploy)

- **Privacy Warning in Swagger UI**: Visible notice about data collection with
  link to privacy policy

### 🔧 Changed

- **Middleware Enhancement**: `structuredLogger` now enriches logs with query
  params and referer
- **Environment-Aware Logging**: Automatically enabled in production
  (`ENVIRONMENT=production`)
- **Dual Logging on Deno Deploy**: Both `console.log()` (dashboard) and
  PostgreSQL (long-term storage)

### 🛠️ Configuration

- **New Environment Variables**:
  - `USE_STRUCTURED_LOGGER`: Enable structured logging (default: false in dev,
    true in production)
  - `LOG_STORAGE_BACKEND`: Choose backend (`auto`, `duckdb`, `postgres`) -
    auto-detects based on `DATABASE_URL`
  - `DATABASE_URL`: PostgreSQL connection string (enables PostgreSQL backend)

### 📦 Dependencies

- **Added**:
  - `@duckdb/node-api@^1.4.2-r.1` (npm): DuckDB client for Deno
  - `pg@^8.13.1` (npm): PostgreSQL client

### 🧪 Tests

- Updated test permissions: `--allow-ffi` and `--allow-write` for DuckDB support
- All 145 tests passing

### 📚 Documentation

- Privacy policy with official GDPR/CNIL source links
- Technical logging documentation with architecture diagrams
- Updated README with logging documentation link
- OpenAPI version updated to 1.2.0

### 🔒 Privacy & Compliance

- ✅ GDPR compliant (Articles 5.1.c, 6.1.f, 6.1.c, 15-17, 21)
- ✅ CNIL recommendations followed (6-month retention)
- ✅ Data minimization principle applied
- ✅ Transparent international data transfers disclosure
- ✅ User rights documented with practical limitations

### 🏗️ Architecture

**Multi-Environment Support**:

- **Local dev**: DuckDB file (`logs/access_logs.db`) or PostgreSQL
- **Self-hosted**: DuckDB file or PostgreSQL (your choice)
- **Deno Deploy**: Dashboard logs (free) + optional PostgreSQL external
  (Neon.tech)

**Data Flow**:

```
HTTP Request → structuredLogger
    ├─→ console.log() → Deno Deploy Dashboard
    └─→ Factory → DuckDB or PostgreSQL (based on DATABASE_URL)
```

### 📊 Impact Summary

**Observability**:

- ✅ Complete HTTP request tracking
- ✅ Performance monitoring (duration tracking)
- ✅ Error diagnosis (status codes, stack traces)
- ✅ Usage statistics (endpoints, query patterns)

**Compliance**:

- ✅ Legal data collection framework
- ✅ User transparency and rights
- ✅ International transfer compliance

**Flexibility**:

- ✅ Works in all deployment scenarios
- ✅ Optional PostgreSQL for advanced analytics
- ✅ Zero configuration required in dev

---

## [1.1.0] - 2025-12-07

### ✨ Added

- **Extended Search Results**: Add `extend` parameter to `/medias/search`
  endpoint
  - Default behavior: returns simple format with `{nom, type}` only
  - `extend=true`: returns full `MediaEnrichi` objects with ownership data
  - `extend=false`: explicit simple format
  - Includes validation with 400 error for invalid values
  - Enables flexible API consumption based on client needs

### 🔧 Changed

- **CORS Configuration**: Make allowed origins configurable via environment
  variables
  - `ALLOWED_ORIGINS`: comma-separated list of allowed origins
  - More flexible deployment across different domains
  - Maintains security while improving configurability

### 📚 Documentation

- Add comprehensive documentation for `extend` parameter
  - OpenAPI/Swagger specification updated
  - Usage examples with curl and httpie
  - API endpoint documentation updated
- Improve installation documentation with Arch Linux instructions
- Add practical API usage examples
- Update rate limiting and sorting parameters documentation
- Clean up unused documentation file references

### 🧪 Tests

- Add comprehensive test coverage for `extend` parameter
  - 4 new service-layer tests
  - 6 new API-layer tests
  - Validation and error handling tests
  - All 137 tests passing (1 ignored)

### 🐛 Fixed

- Fix TypeScript type assertions in tests (replaced `any` with `MediaEnrichi[]`)
- Fix allowed origins domain extension configuration

---

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
