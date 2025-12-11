import { assertEquals, assertExists } from '@std/assert';
import app from '../../src/app.ts';

Deno.test('Security Headers - CSP should be present', async () => {
  const res = await app.request('/health');
  const csp = res.headers.get('Content-Security-Policy');

  assertExists(csp, 'CSP header should be present');
});

Deno.test('Security Headers - X-Frame-Options should be DENY', async () => {
  const res = await app.request('/health');

  assertEquals(res.headers.get('X-Frame-Options'), 'DENY');
});

Deno.test('Security Headers - X-Content-Type-Options should be nosniff', async () => {
  const res = await app.request('/health');

  assertEquals(res.headers.get('X-Content-Type-Options'), 'nosniff');
});

Deno.test('Security Headers - X-XSS-Protection should be present', async () => {
  const res = await app.request('/health');

  assertEquals(res.headers.get('X-XSS-Protection'), '1; mode=block');
});

Deno.test('Security Headers - Referrer-Policy should be present', async () => {
  const res = await app.request('/health');

  assertEquals(
    res.headers.get('Referrer-Policy'),
    'strict-origin-when-cross-origin'
  );
});

Deno.test('Security Headers - Permissions-Policy should be present', async () => {
  const res = await app.request('/health');
  const policy = res.headers.get('Permissions-Policy');

  assertExists(policy, 'Permissions-Policy header should be present');
  assertEquals(
    policy?.includes('geolocation=()'),
    true,
    'Should disable geolocation'
  );
  assertEquals(
    policy?.includes('camera=()'),
    true,
    'Should disable camera'
  );
});

Deno.test('Security Headers - All endpoints should have security headers', async () => {
  const endpoints = [
    '/medias',
    '/personnes',
    '/organisations',
    '/stats/count'
  ];

  for (const endpoint of endpoints) {
    const res = await app.request(endpoint);

    assertExists(
      res.headers.get('Content-Security-Policy'),
      `CSP should be present on ${endpoint}`
    );
    assertEquals(
      res.headers.get('X-Frame-Options'),
      'DENY',
      `X-Frame-Options should be DENY on ${endpoint}`
    );
    assertEquals(
      res.headers.get('X-Content-Type-Options'),
      'nosniff',
      `X-Content-Type-Options should be nosniff on ${endpoint}`
    );
  }
});
