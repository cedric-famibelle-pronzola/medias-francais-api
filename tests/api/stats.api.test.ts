import { assertEquals, assertExists } from '@std/assert';
import { clearData, setTestData } from '../../src/data/index.ts';
import app from '../../src/app.ts';
import { mockMedias, mockOrganisations, mockPersonnes } from '../setup.ts';

function setup() {
  setTestData(mockMedias, mockPersonnes, mockOrganisations);
}

function cleanup() {
  clearData();
}

// Root endpoint tests
Deno.test('GET /api - returns API info', async () => {
  setup();
  try {
    const res = await app.request('/api');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.name, 'Médias Français API');
    assertExists(json.version);
    assertExists(json.endpoints);
  } finally {
    cleanup();
  }
});

// Stats endpoints tests
Deno.test('GET /api/stats - returns global statistics', async () => {
  setup();
  try {
    const res = await app.request('/api/stats');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.totaux);
    assertEquals(json.totaux.medias, 5);
    assertEquals(json.totaux.personnes, 4);
    assertEquals(json.totaux.organisations, 3);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/stats - returns medias by type', async () => {
  setup();
  try {
    const res = await app.request('/api/stats');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.mediasParType);
    assertEquals(json.mediasParType['Télévision'], 2);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/stats - returns medias by prix', async () => {
  setup();
  try {
    const res = await app.request('/api/stats');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.mediasParPrix);
    assertEquals(json.mediasParPrix['Gratuit'], 3);
    assertEquals(json.mediasParPrix['Payant'], 2);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/stats - returns medias disparus count', async () => {
  setup();
  try {
    const res = await app.request('/api/stats');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.mediasDisparus, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/stats/concentration - returns concentration analysis', async () => {
  setup();
  try {
    const res = await app.request('/api/stats/concentration');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.parPersonnes);
    assertExists(json.parOrganisations);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/stats/concentration - sorts by media count', async () => {
  setup();
  try {
    const res = await app.request('/api/stats/concentration');
    const json = await res.json();

    assertEquals(res.status, 200);
    // Check sorting
    for (let i = 0; i < json.parPersonnes.length - 1; i++) {
      assertEquals(
        json.parPersonnes[i].nbMedias >= json.parPersonnes[i + 1].nbMedias,
        true
      );
    }
  } finally {
    cleanup();
  }
});

// Référentiels endpoints tests
Deno.test('GET /api/types - returns list of media types', async () => {
  setup();
  try {
    const res = await app.request('/api/types');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.types);
    assertEquals(Array.isArray(json.types), true);
    assertEquals(json.types.includes('Télévision'), true);
    assertEquals(json.types.includes('Radio'), true);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/echelles - returns list of geographic scales', async () => {
  setup();
  try {
    const res = await app.request('/api/echelles');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.echelles);
    assertEquals(Array.isArray(json.echelles), true);
    assertEquals(json.echelles.includes('National'), true);
    assertEquals(json.echelles.includes('Suisse'), true);
  } finally {
    cleanup();
  }
});

// 404 handler test
Deno.test('GET /api/unknown - returns 404', async () => {
  setup();
  try {
    const res = await app.request('/api/unknown-route');
    const json = await res.json();

    assertEquals(res.status, 404);
    assertExists(json.error);
    assertEquals(json.error.code, 404);
  } finally {
    cleanup();
  }
});
