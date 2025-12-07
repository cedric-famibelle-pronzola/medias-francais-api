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

Deno.test('GET /medias/search - returns simple format by default', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/medias/search?q=monde`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.query, 'monde');
    assertExists(json.count);
    assertEquals(json.count, 1);
    assertExists(json.results);
    assertEquals(json.results.length, 1);

    // Should only have nom and type
    const result = json.results[0];
    assertEquals(result.nom, 'Le Monde');
    assertEquals(result.type, 'Presse (généraliste  politique  économique)');
    assertEquals(Object.keys(result).length, 2);
    assertEquals('proprietaires' in result, false);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - returns simple format with extend=false', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/search?q=monde&extend=false`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.count, 1);

    // Should only have nom and type
    const result = json.results[0];
    assertEquals(result.nom, 'Le Monde');
    assertEquals(result.type, 'Presse (généraliste  politique  économique)');
    assertEquals(Object.keys(result).length, 2);
    assertEquals('proprietaires' in result, false);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - returns full format with extend=true', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/search?q=monde&extend=true`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.query, 'monde');
    assertEquals(json.count, 1);

    // Should have all MediaEnrichi properties
    const result = json.results[0];
    assertEquals(result.nom, 'Le Monde');
    assertEquals(result.type, 'Presse (généraliste  politique  économique)');
    assertExists(result.prix);
    assertExists(result.echelle);
    assertExists(result.periodicite);
    assertExists(result.disparu);
    assertExists(result.proprietaires);
    assertExists(result.chaineProprietaires);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - extended format includes ownership data', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/search?q=monde&extend=true`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    const result = json.results[0];

    // Verify proprietaires array has data
    assertExists(result.proprietaires);
    assertEquals(Array.isArray(result.proprietaires), true);
    assertEquals(result.proprietaires.length > 0, true);

    // Verify chaineProprietaires array has data
    assertExists(result.chaineProprietaires);
    assertEquals(Array.isArray(result.chaineProprietaires), true);
    assertEquals(result.chaineProprietaires.length > 0, true);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - validates extend parameter', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/search?q=monde&extend=invalid`
    );
    const json = await res.json();

    assertEquals(res.status, 400);
    assertExists(json.error);
    assertEquals(json.error.code, 'VALIDATION_ERROR');
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - sorts results by nom ascending', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/search?q=monde&sort=nom&order=asc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.results.length, 1);
    assertEquals(json.results[0].nom, 'Le Monde');
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - sorts results by nom descending', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/search?q=monde&sort=nom&order=desc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.results.length, 1);
    assertEquals(json.results[0].nom, 'Le Monde');
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - sorting works with extend=true', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/search?q=monde&sort=nom&order=asc&extend=true`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.results.length, 1);
    assertEquals(json.results[0].nom, 'Le Monde');
    // Verify extended format
    assertExists(json.results[0].proprietaires);
    assertExists(json.results[0].chaineProprietaires);
  } finally {
    cleanup();
  }
});

Deno.test('GET /medias/search - sorting works with search query', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/medias/search?q=in&sort=nom&order=asc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.results.length >= 2, true); // "La Cinq" and "France Inter"
    // Verify results are sorted
    for (let i = 0; i < json.results.length - 1; i++) {
      assertEquals(
        json.results[i].nom.localeCompare(json.results[i + 1].nom, 'fr') <= 0,
        true
      );
    }
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
