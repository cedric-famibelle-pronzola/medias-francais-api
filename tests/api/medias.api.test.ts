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

Deno.test('GET /api/medias - returns paginated list', async () => {
  setup();
  try {
    const res = await app.request('/api/medias');
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

Deno.test('GET /api/medias - accepts pagination params', async () => {
  setup();
  try {
    const res = await app.request('/api/medias?page=1&limit=2');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.pagination.limit, 2);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/medias - filters by type', async () => {
  setup();
  try {
    const res = await app.request('/api/medias?type=Télévision');
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

Deno.test('GET /api/medias - filters by prix', async () => {
  setup();
  try {
    const res = await app.request('/api/medias?prix=Gratuit');
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

Deno.test('GET /api/medias - filters by disparu', async () => {
  setup();
  try {
    const res = await app.request('/api/medias?disparu=true');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 1);
    assertEquals(json.data[0].disparu, true);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/medias/search - searches by query', async () => {
  setup();
  try {
    const res = await app.request('/api/medias/search?q=monde');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.query, 'monde');
    assertExists(json.results);
    assertEquals(json.results.length, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/medias/search - returns 400 for short query', async () => {
  setup();
  try {
    const res = await app.request('/api/medias/search?q=a');
    const json = await res.json();

    assertEquals(res.status, 400);
    assertExists(json.error);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/medias/:nom - returns media details', async () => {
  setup();
  try {
    const res = await app.request('/api/medias/Le%20Monde');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.nom, 'Le Monde');
    assertExists(json.proprietaires);
    assertExists(json.chaineProprietaires);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/medias/:nom - returns 404 for non-existent media', async () => {
  setup();
  try {
    const res = await app.request('/api/medias/NonExistent');
    const json = await res.json();

    assertEquals(res.status, 404);
    assertExists(json.error);
    assertEquals(json.error.code, 404);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/medias/:nom/proprietaires - returns direct owners', async () => {
  setup();
  try {
    const res = await app.request('/api/medias/Le%20Monde/proprietaires');
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.media, 'Le Monde');
    assertExists(json.proprietaires);
    assertEquals(json.proprietaires.length, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /api/medias/:nom/proprietaires-ultimes - returns ownership chain', async () => {
  setup();
  try {
    const res = await app.request(
      '/api/medias/Le%20Monde/proprietaires-ultimes'
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.media, 'Le Monde');
    assertExists(json.proprietairesUltimes);
  } finally {
    cleanup();
  }
});
