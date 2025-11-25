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

Deno.test('GET /medias - returns paginated list', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.data);
    assertExists(json.pagination);
    assertEquals(json.pagination.page, 1);
    assertEquals(json.pagination.limit, 20);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias - accepts pagination params', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias?page=1&limit=2`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.pagination.limit, 2);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias - filters by type', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias?type=Télévision`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(
      json.data.every((m: { type: string }) => m.type === 'Télévision'),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias - filters by prix', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias?prix=Gratuit`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(
      json.data.every((m: { prix: string }) => m.prix === 'Gratuit'),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias - filters by disparu', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias?disparu=true`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 1);
    assertEquals(json.data[0].disparu, true);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - searches by query', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias/search?q=monde`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.query, 'monde');
    assertExists(json.results);
    assertEquals(json.results.length, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - returns 400 for short query', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias/search?q=a`);
    const json = await res.json();

    assertEquals(res.status, 400);
    assertExists(json.error);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/:nom - returns media details', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias/Le%20Monde`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.nom, 'Le Monde');
    assertExists(json.proprietaires);
    assertExists(json.chaineProprietaires);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/:nom - returns 404 for non-existent media', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias/NonExistent`);
    const json = await res.json();

    assertEquals(res.status, 404);
    assertExists(json.error);
    assertEquals(json.error.code, 'NOT_FOUND');
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/:nom/proprietaires - returns direct owners', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/Le%20Monde/proprietaires`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.media, 'Le Monde');
    assertExists(json.proprietaires);
    assertEquals(json.proprietaires.length, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/:nom/proprietaires-ultimes - returns ownership chain', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/Le%20Monde/proprietaires-ultimes`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.media, 'Le Monde');
    assertExists(json.proprietairesUltimes);
  } finally {
    cleanup();
  }
});

// Sorting tests
Deno.test('GET /medias - sorts by nom ascending', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias?sort=nom&order=asc`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data[0].nom, 'BFM TV');
    assertEquals(json.data[json.data.length - 1].nom, 'Tribune de Genève');
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias - sorts by nom descending', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias?sort=nom&order=desc`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data[0].nom, 'Tribune de Genève');
    assertEquals(json.data[json.data.length - 1].nom, 'BFM TV');
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias - sorts by type', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias?sort=type&order=asc`);
    const json = await res.json();

    assertEquals(res.status, 200);
    // Presse should come before Radio and Télévision
    assertEquals(
      json.data[0].type,
      'Presse (généraliste  politique  économique)'
    );
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias - sorting works with filters', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias?type=Télévision&sort=nom&order=asc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.data[0].nom, 'BFM TV');
    assertEquals(json.data[1].nom, 'La Cinq');
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias - sorting works with pagination', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias?sort=nom&order=asc&page=1&limit=2`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.data[0].nom, 'BFM TV');
    assertEquals(json.data[1].nom, 'France Inter');
  } finally {
    cleanup();
  }
});
