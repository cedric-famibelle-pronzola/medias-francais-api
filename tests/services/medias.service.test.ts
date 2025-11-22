import { assertEquals, assertExists } from '@std/assert';
import { clearData, setTestData } from '../../src/data/index.ts';
import { mediasService } from '../../src/services/medias.service.ts';
import { mockMedias, mockOrganisations, mockPersonnes } from '../setup.ts';

// Setup before each test
function setup() {
  setTestData(mockMedias, mockPersonnes, mockOrganisations);
}

// Cleanup after tests
function cleanup() {
  clearData();
}

Deno.test('mediasService.all - returns all medias with pagination', () => {
  setup();
  try {
    const result = mediasService.all({}, { page: 1, limit: 10 });

    assertEquals(result.data.length, 5);
    assertEquals(result.pagination.total, 5);
    assertEquals(result.pagination.page, 1);
    assertEquals(result.pagination.limit, 10);
    assertEquals(result.pagination.pages, 1);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - paginates correctly', () => {
  setup();
  try {
    const result = mediasService.all({}, { page: 1, limit: 2 });

    assertEquals(result.data.length, 2);
    assertEquals(result.pagination.total, 5);
    assertEquals(result.pagination.pages, 3);

    const page2 = mediasService.all({}, { page: 2, limit: 2 });
    assertEquals(page2.data.length, 2);
    assertEquals(page2.pagination.page, 2);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - filters by type', () => {
  setup();
  try {
    const result = mediasService.all({ type: 'Télévision' }, {
      page: 1,
      limit: 10
    });

    assertEquals(result.data.length, 2);
    assertEquals(result.data.every((m) => m.type === 'Télévision'), true);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - filters by prix', () => {
  setup();
  try {
    const result = mediasService.all({ prix: 'Gratuit' }, {
      page: 1,
      limit: 10
    });

    assertEquals(result.data.length, 3);
    assertEquals(result.data.every((m) => m.prix === 'Gratuit'), true);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - filters by echelle', () => {
  setup();
  try {
    const result = mediasService.all({ echelle: 'Suisse' }, {
      page: 1,
      limit: 10
    });

    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].nom, 'Tribune de Genève');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - filters by disparu', () => {
  setup();
  try {
    const result = mediasService.all({ disparu: true }, { page: 1, limit: 10 });

    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].nom, 'La Cinq');
    assertEquals(result.data[0].disparu, true);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - combines multiple filters', () => {
  setup();
  try {
    const result = mediasService.all(
      { type: 'Télévision', prix: 'Gratuit', disparu: false },
      { page: 1, limit: 10 }
    );

    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].nom, 'BFM TV');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.findByNom - finds media by exact name', () => {
  setup();
  try {
    const media = mediasService.findByNom('Le Monde');

    assertExists(media);
    assertEquals(media.nom, 'Le Monde');
    assertEquals(media.type, 'Presse (généraliste  politique  économique)');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.findByNom - case insensitive search', () => {
  setup();
  try {
    const media = mediasService.findByNom('le monde');

    assertExists(media);
    assertEquals(media.nom, 'Le Monde');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.findByNom - returns undefined for non-existent media', () => {
  setup();
  try {
    const media = mediasService.findByNom('Non Existent Media');

    assertEquals(media, undefined);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - finds medias by partial name', () => {
  setup();
  try {
    const results = mediasService.search('monde');

    assertEquals(results.length, 1);
    assertEquals(results[0].nom, 'Le Monde');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - case insensitive search', () => {
  setup();
  try {
    const results = mediasService.search('BFM');

    assertEquals(results.length, 1);
    assertEquals(results[0].nom, 'BFM TV');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - returns empty array for no matches', () => {
  setup();
  try {
    const results = mediasService.search('zzzzz');

    assertEquals(results.length, 0);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.getTypes - returns unique types', () => {
  setup();
  try {
    const types = mediasService.getTypes();

    assertEquals(types.includes('Télévision'), true);
    assertEquals(types.includes('Radio'), true);
    assertEquals(
      types.includes('Presse (généraliste  politique  économique)'),
      true
    );
    // Should not have duplicates
    assertEquals(types.length, new Set(types).size);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.getEchelles - returns unique echelles', () => {
  setup();
  try {
    const echelles = mediasService.getEchelles();

    assertEquals(echelles.includes('National'), true);
    assertEquals(echelles.includes('Suisse'), true);
    // Should not have duplicates
    assertEquals(echelles.length, new Set(echelles).size);
  } finally {
    cleanup();
  }
});
