import { assertEquals, assertExists } from '@std/assert';
import {
  clearData,
  type MediaEnrichi,
  setTestData
} from '../../src/data/index.ts';
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

Deno.test('mediasService.search - returns simple format by default', () => {
  setup();
  try {
    const results = mediasService.search('monde');

    assertEquals(results.length, 1);
    assertEquals(results[0].nom, 'Le Monde');
    assertEquals(
      results[0].type,
      'Presse (généraliste  politique  économique)'
    );
    // Should only have nom and type
    assertEquals(Object.keys(results[0]).length, 2);
    assertEquals('proprietaires' in results[0], false);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - returns simple format with extend=false', () => {
  setup();
  try {
    const results = mediasService.search('monde', false);

    assertEquals(results.length, 1);
    assertEquals(results[0].nom, 'Le Monde');
    assertEquals(
      results[0].type,
      'Presse (généraliste  politique  économique)'
    );
    // Should only have nom and type
    assertEquals(Object.keys(results[0]).length, 2);
    assertEquals('proprietaires' in results[0], false);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - returns full format with extend=true', () => {
  setup();
  try {
    const results = mediasService.search('monde', true) as MediaEnrichi[];

    assertEquals(results.length, 1);
    const media = results[0];
    assertEquals(media.nom, 'Le Monde');
    assertEquals(media.type, 'Presse (généraliste  politique  économique)');
    // Should have all MediaEnrichi properties
    assertExists(media.prix);
    assertExists(media.echelle);
    assertExists(media.periodicite);
    assertExists(media.proprietaires);
    assertExists(media.chaineProprietaires);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - extended format includes ownership data', () => {
  setup();
  try {
    const results = mediasService.search('monde', true) as MediaEnrichi[];

    assertEquals(results.length, 1);
    const media = results[0];

    // Verify proprietaires array exists and has data
    assertExists(media.proprietaires);
    assertEquals(Array.isArray(media.proprietaires), true);
    assertEquals(media.proprietaires.length > 0, true);

    // Verify chaineProprietaires array exists and has data
    assertExists(media.chaineProprietaires);
    assertEquals(Array.isArray(media.chaineProprietaires), true);
    assertEquals(media.chaineProprietaires.length > 0, true);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - sorts results by nom ascending', () => {
  setup();
  try {
    // Search for a term and apply sorting
    const results = mediasService.search('monde', false, {
      sort: 'nom',
      order: 'asc'
    });

    assertEquals(results.length, 1);
    assertEquals(results[0].nom, 'Le Monde');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - sorts results by nom descending', () => {
  setup();
  try {
    const results = mediasService.search('monde', false, {
      sort: 'nom',
      order: 'desc'
    });

    assertEquals(results.length, 1);
    assertEquals(results[0].nom, 'Le Monde');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - sorts with extend=true', () => {
  setup();
  try {
    const results = mediasService.search('monde', true, {
      sort: 'nom',
      order: 'asc'
    }) as MediaEnrichi[];

    assertEquals(results.length, 1);
    assertEquals(results[0].nom, 'Le Monde');
    // Verify it's full format
    assertExists(results[0].proprietaires);
    assertExists(results[0].chaineProprietaires);
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.search - sorting works with search query', () => {
  setup();
  try {
    // Search for medias containing "in": "La Cinq", "France Inter", "Tribune de Genève"
    const results = mediasService.search('in', false, {
      sort: 'nom',
      order: 'asc'
    });

    // Should find multiple and sort them
    assertEquals(results.length >= 2, true);
    // Verify sorted order
    for (let i = 0; i < results.length - 1; i++) {
      assertEquals(
        results[i].nom.localeCompare(results[i + 1].nom, 'fr') <= 0,
        true
      );
    }
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

// Sorting tests
Deno.test('mediasService.all - sorts by nom ascending', () => {
  setup();
  try {
    const result = mediasService.all({}, { page: 1, limit: 10 }, {
      sort: 'nom',
      order: 'asc'
    });

    assertEquals(result.data[0].nom, 'BFM TV');
    assertEquals(result.data[1].nom, 'France Inter');
    assertEquals(result.data[2].nom, 'La Cinq');
    assertEquals(result.data[3].nom, 'Le Monde');
    assertEquals(result.data[4].nom, 'Tribune de Genève');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - sorts by nom descending', () => {
  setup();
  try {
    const result = mediasService.all({}, { page: 1, limit: 10 }, {
      sort: 'nom',
      order: 'desc'
    });

    assertEquals(result.data[0].nom, 'Tribune de Genève');
    assertEquals(result.data[1].nom, 'Le Monde');
    assertEquals(result.data[2].nom, 'La Cinq');
    assertEquals(result.data[3].nom, 'France Inter');
    assertEquals(result.data[4].nom, 'BFM TV');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - sorts by type', () => {
  setup();
  try {
    const result = mediasService.all({}, { page: 1, limit: 10 }, {
      sort: 'type',
      order: 'asc'
    });

    // Presse comes before Radio, Radio before Télévision
    assertEquals(
      result.data[0].type,
      'Presse (généraliste  politique  économique)'
    );
    assertEquals(
      result.data[1].type,
      'Presse (généraliste  politique  économique)'
    );
    assertEquals(result.data[2].type, 'Radio');
    assertEquals(result.data[3].type, 'Télévision');
    assertEquals(result.data[4].type, 'Télévision');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - sorts by prix', () => {
  setup();
  try {
    const result = mediasService.all({}, { page: 1, limit: 10 }, {
      sort: 'prix',
      order: 'asc'
    });

    // Gratuit comes before Payant
    assertEquals(result.data[0].prix, 'Gratuit');
    assertEquals(result.data[1].prix, 'Gratuit');
    assertEquals(result.data[2].prix, 'Gratuit');
    assertEquals(result.data[3].prix, 'Payant');
    assertEquals(result.data[4].prix, 'Payant');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - default sort order is ascending', () => {
  setup();
  try {
    const result = mediasService.all({}, { page: 1, limit: 10 }, {
      sort: 'nom'
    });

    assertEquals(result.data[0].nom, 'BFM TV');
    assertEquals(result.data[4].nom, 'Tribune de Genève');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - sorting works with filters', () => {
  setup();
  try {
    const result = mediasService.all(
      { type: 'Télévision' },
      { page: 1, limit: 10 },
      { sort: 'nom', order: 'asc' }
    );

    assertEquals(result.data.length, 2);
    assertEquals(result.data[0].nom, 'BFM TV');
    assertEquals(result.data[1].nom, 'La Cinq');
  } finally {
    cleanup();
  }
});

Deno.test('mediasService.all - sorting works with pagination', () => {
  setup();
  try {
    const page1 = mediasService.all({}, { page: 1, limit: 2 }, {
      sort: 'nom',
      order: 'asc'
    });
    const page2 = mediasService.all({}, { page: 2, limit: 2 }, {
      sort: 'nom',
      order: 'asc'
    });

    assertEquals(page1.data[0].nom, 'BFM TV');
    assertEquals(page1.data[1].nom, 'France Inter');
    assertEquals(page2.data[0].nom, 'La Cinq');
    assertEquals(page2.data[1].nom, 'Le Monde');
  } finally {
    cleanup();
  }
});
