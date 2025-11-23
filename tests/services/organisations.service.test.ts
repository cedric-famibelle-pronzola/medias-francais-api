import { assertEquals, assertExists } from '@std/assert';
import { clearData, setTestData } from '../../src/data/index.ts';
import { organisationsService } from '../../src/services/organisations.service.ts';
import { mockMedias, mockOrganisations, mockPersonnes } from '../setup.ts';

function setup() {
  setTestData(mockMedias, mockPersonnes, mockOrganisations);
}

function cleanup() {
  clearData();
}

Deno.test('organisationsService.all - returns all organisations with pagination', () => {
  setup();
  try {
    const result = organisationsService.all({}, { page: 1, limit: 10 });

    assertEquals(result.data.length, 3);
    assertEquals(result.pagination.total, 3);
    assertEquals(result.pagination.page, 1);
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - paginates correctly', () => {
  setup();
  try {
    const result = organisationsService.all({}, { page: 1, limit: 2 });

    assertEquals(result.data.length, 2);
    assertEquals(result.pagination.total, 3);
    assertEquals(result.pagination.pages, 2);
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - filters by hasMedias', () => {
  setup();
  try {
    const result = organisationsService.all({ hasMedias: true }, {
      page: 1,
      limit: 10
    });

    assertEquals(result.data.length, 2);
    assertEquals(result.data.every((o) => o.medias.length > 0), true);
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - filters by hasFiliales', () => {
  setup();
  try {
    const result = organisationsService.all({ hasFiliales: true }, {
      page: 1,
      limit: 10
    });

    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].nom, 'Vivendi');
    assertEquals(result.data[0].filiales.length > 0, true);
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - combines multiple filters', () => {
  setup();
  try {
    const result = organisationsService.all(
      { hasMedias: true, hasFiliales: true },
      { page: 1, limit: 10 }
    );

    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.findByNom - finds organisation by exact name', () => {
  setup();
  try {
    const org = organisationsService.findByNom('Vivendi');

    assertExists(org);
    assertEquals(org.nom, 'Vivendi');
    assertEquals(org.filiales.length, 1);
    assertEquals(org.medias.length, 1);
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.findByNom - case insensitive search', () => {
  setup();
  try {
    const org = organisationsService.findByNom('vivendi');

    assertExists(org);
    assertEquals(org.nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.findByNom - returns undefined for non-existent organisation', () => {
  setup();
  try {
    const org = organisationsService.findByNom('Non Existent Org');

    assertEquals(org, undefined);
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.findByNom - includes proprietaires', () => {
  setup();
  try {
    const org = organisationsService.findByNom('Vivendi');

    assertExists(org);
    assertEquals(org.proprietaires.length, 1);
    assertEquals(org.proprietaires[0].nom, 'Bolloré');
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.findByNom - includes filiales', () => {
  setup();
  try {
    const org = organisationsService.findByNom('Vivendi');

    assertExists(org);
    assertEquals(org.filiales.length, 1);
    assertEquals(org.filiales[0].nom, 'Canal+ Group');
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.findByNom - includes medias', () => {
  setup();
  try {
    const org = organisationsService.findByNom('Vivendi');

    assertExists(org);
    assertEquals(org.medias.length, 1);
    assertEquals(org.medias[0].nom, 'Canal +');
  } finally {
    cleanup();
  }
});

// Sorting tests
Deno.test('organisationsService.all - sorts by nom ascending', () => {
  setup();
  try {
    const result = organisationsService.all({}, { page: 1, limit: 10 }, {
      sort: 'nom',
      order: 'asc'
    });

    assertEquals(result.data[0].nom, 'Le Monde libre');
    assertEquals(result.data[1].nom, 'Organisation Sans Media');
    assertEquals(result.data[2].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - sorts by nom descending', () => {
  setup();
  try {
    const result = organisationsService.all({}, { page: 1, limit: 10 }, {
      sort: 'nom',
      order: 'desc'
    });

    assertEquals(result.data[0].nom, 'Vivendi');
    assertEquals(result.data[1].nom, 'Organisation Sans Media');
    assertEquals(result.data[2].nom, 'Le Monde libre');
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - sorts by nbMedias', () => {
  setup();
  try {
    const result = organisationsService.all({}, { page: 1, limit: 10 }, {
      sort: 'nbMedias',
      order: 'desc'
    });

    // Vivendi and Le Monde libre have 1 media each
    assertEquals(result.data[0].medias.length, 1);
    assertEquals(result.data[1].medias.length, 1);
    // Organisation Sans Media has 0 medias
    assertEquals(result.data[2].nom, 'Organisation Sans Media');
    assertEquals(result.data[2].medias.length, 0);
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - sorts by nbFiliales', () => {
  setup();
  try {
    const result = organisationsService.all({}, { page: 1, limit: 10 }, {
      sort: 'nbFiliales',
      order: 'desc'
    });

    // Vivendi has 1 filiale
    assertEquals(result.data[0].nom, 'Vivendi');
    assertEquals(result.data[0].filiales.length, 1);
    // Others have 0 filiales
    assertEquals(result.data[1].filiales.length, 0);
    assertEquals(result.data[2].filiales.length, 0);
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - default sort order is ascending', () => {
  setup();
  try {
    const result = organisationsService.all({}, { page: 1, limit: 10 }, {
      sort: 'nom'
    });

    assertEquals(result.data[0].nom, 'Le Monde libre');
    assertEquals(result.data[2].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - sorting works with filters', () => {
  setup();
  try {
    const result = organisationsService.all(
      { hasMedias: true },
      { page: 1, limit: 10 },
      { sort: 'nom', order: 'asc' }
    );

    assertEquals(result.data.length, 2);
    assertEquals(result.data[0].nom, 'Le Monde libre');
    assertEquals(result.data[1].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});

Deno.test('organisationsService.all - sorting works with pagination', () => {
  setup();
  try {
    const page1 = organisationsService.all({}, { page: 1, limit: 2 }, {
      sort: 'nom',
      order: 'asc'
    });
    const page2 = organisationsService.all({}, { page: 2, limit: 2 }, {
      sort: 'nom',
      order: 'asc'
    });

    assertEquals(page1.data[0].nom, 'Le Monde libre');
    assertEquals(page1.data[1].nom, 'Organisation Sans Media');
    assertEquals(page2.data[0].nom, 'Vivendi');
  } finally {
    cleanup();
  }
});
