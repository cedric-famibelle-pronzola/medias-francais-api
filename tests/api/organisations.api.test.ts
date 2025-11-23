import { assertEquals, assertExists } from '@std/assert';
import { clearData, setTestData } from '../../src/data/index.ts';
import app from '../../src/app.ts';
import {
  API_BASE,
  mockMedias,
  mockOrganisations,
  mockPersonnes
} from '../setup.ts';

function setup() {
  setTestData(mockMedias, mockPersonnes, mockOrganisations);
}

function cleanup() {
  clearData();
}

Deno.test('GET /organisations - returns paginated list', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/organisations`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.data);
    assertExists(json.pagination);
    assertEquals(json.pagination.page, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations - accepts pagination params', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/organisations?page=1&limit=2`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.pagination.limit, 2);
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations - filters by has_medias', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/organisations?has_medias=true`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(
      json.data.every((o: { medias: unknown[] }) => o.medias.length > 0),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations - filters by has_filiales', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/organisations?has_filiales=true`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 1);
    assertEquals(json.data[0].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations/:nom - returns organisation details', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/organisations/Vivendi`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.nom, 'Vivendi');
    assertExists(json.proprietaires);
    assertExists(json.filiales);
    assertExists(json.medias);
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations/:nom - returns 404 for non-existent org', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/organisations/NonExistent`);
    const json = await res.json();

    assertEquals(res.status, 404);
    assertExists(json.error);
    assertEquals(json.error.code, 404);
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations/:nom/filiales - returns subsidiaries', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/organisations/Vivendi/filiales`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.organisation, 'Vivendi');
    assertExists(json.filiales);
    assertEquals(json.filiales.length, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations/:nom/medias - returns owned medias', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/organisations/Vivendi/medias`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.organisation, 'Vivendi');
    assertExists(json.medias);
    assertEquals(json.medias.length, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations/:nom/hierarchie - returns full hierarchy', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/organisations/Vivendi/hierarchie`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.organisation, 'Vivendi');
    assertExists(json.parents);
    assertExists(json.enfants);
    assertEquals(json.parents.length, 1);
    assertEquals(json.enfants.length, 1);
  } finally {
    cleanup();
  }
});

// Sorting tests
Deno.test('GET /organisations - sorts by nom ascending', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/organisations?sort=nom&order=asc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data[0].nom, 'Le Monde libre');
    assertEquals(json.data[json.data.length - 1].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations - sorts by nom descending', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/organisations?sort=nom&order=desc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data[0].nom, 'Vivendi');
    assertEquals(json.data[json.data.length - 1].nom, 'Le Monde libre');
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations - sorts by nbMedias', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/organisations?sort=nbMedias&order=desc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    // Organisation Sans Media has 0 medias, should be last
    assertEquals(
      json.data[json.data.length - 1].nom,
      'Organisation Sans Media'
    );
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations - sorts by nbFiliales', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/organisations?sort=nbFiliales&order=desc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    // Vivendi has 1 filiale, should be first
    assertEquals(json.data[0].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations - sorting works with filters', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/organisations?has_medias=true&sort=nom&order=asc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.data[0].nom, 'Le Monde libre');
    assertEquals(json.data[1].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('GET /organisations - sorting works with pagination', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/organisations?sort=nom&order=asc&page=1&limit=2`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.data[0].nom, 'Le Monde libre');
    assertEquals(json.data[1].nom, 'Organisation Sans Media');
  } finally {
    cleanup();
  }
});
