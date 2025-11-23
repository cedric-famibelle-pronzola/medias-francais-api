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

Deno.test('GET /personnes - returns paginated list', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertExists(json.data);
    assertExists(json.pagination);
    assertEquals(json.pagination.page, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - accepts pagination params', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes?page=1&limit=2`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.pagination.limit, 2);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - filters by forbes', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes?forbes=true`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(
      json.data.every((p: { classements: { forbes2024: boolean } }) =>
        p.classements.forbes2024 === true
      ),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - filters by challenges_max', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes?challenges_max=10`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - filters by has_medias', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes?has_medias=true`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 3);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - filters by annee', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/personnes?forbes=true&annee=2023`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(
      json.data.every((p: { classements: { forbes2023: boolean } }) =>
        p.classements.forbes2023 === true
      ),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes/top-challenges - returns rankings', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes/top-challenges`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.annee, 2024);
    assertExists(json.classement);
    assertEquals(json.classement[0].rang, 1);
    assertEquals(json.classement[0].nom, 'Bernard Arnault');
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes/top-challenges - accepts annee param', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/personnes/top-challenges?annee=2023`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.annee, 2023);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes/top-challenges - accepts limit param', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/personnes/top-challenges?limit=2`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.classement.length, 2);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes/:nom - returns personne details', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes/Xavier%20Niel`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.nom, 'Xavier Niel');
    assertExists(json.classements);
    assertExists(json.mediasDirects);
    assertExists(json.mediasViaOrganisations);
    assertExists(json.organisations);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes/:nom - returns 404 for non-existent personne', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes/John%20Doe`);
    const json = await res.json();

    assertEquals(res.status, 404);
    assertExists(json.error);
    assertEquals(json.error.code, 404);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes/:nom/medias - returns owned medias', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes/Xavier%20Niel/medias`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.personne, 'Xavier Niel');
    assertExists(json.mediasDirects);
    assertExists(json.mediasViaOrganisations);
    assertExists(json.total);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes/:nom/organisations - returns controlled orgs', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/personnes/Xavier%20Niel/organisations`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.personne, 'Xavier Niel');
    assertExists(json.organisations);
    assertEquals(json.organisations.length, 1);
  } finally {
    cleanup();
  }
});

// Sorting tests
Deno.test('GET /personnes - sorts by nom ascending', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes?sort=nom&order=asc`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data[0].nom, 'Bernard Arnault');
    assertEquals(json.data[json.data.length - 1].nom, 'Xavier Niel');
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - sorts by nom descending', async () => {
  setup();
  try {
    const res = await app.request(`${API_BASE}/personnes?sort=nom&order=desc`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data[0].nom, 'Xavier Niel');
    assertEquals(json.data[json.data.length - 1].nom, 'Bernard Arnault');
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - sorts by challenges2024', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/personnes?sort=challenges2024&order=asc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data[0].nom, 'Bernard Arnault');
    assertEquals(json.data[0].classements.challenges2024, 1);
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - sorts by nbMedias', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/personnes?sort=nbMedias&order=desc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    // Personne Sans Media has 0 medias, should be last
    assertEquals(json.data[json.data.length - 1].nom, 'Personne Sans Media');
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - sorting works with filters', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/personnes?forbes=true&sort=challenges2024&order=asc`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.data[0].nom, 'Bernard Arnault');
    assertEquals(json.data[1].nom, 'Xavier Niel');
  } finally {
    cleanup();
  }
});

Deno.test('GET /personnes - sorting works with pagination', async () => {
  setup();
  try {
    const res = await app.request(
      `${API_BASE}/personnes?sort=nom&order=asc&page=1&limit=2`
    );
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.data.length, 2);
    assertEquals(json.data[0].nom, 'Bernard Arnault');
    assertEquals(json.data[1].nom, 'Patrick Drahi');
  } finally {
    cleanup();
  }
});
