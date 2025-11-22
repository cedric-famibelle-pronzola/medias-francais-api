import { assertEquals, assertExists } from '@std/assert';
import { clearData, setTestData } from '../../src/data/index.ts';
import { personnesService } from '../../src/services/personnes.service.ts';
import { mockMedias, mockOrganisations, mockPersonnes } from '../setup.ts';

function setup() {
  setTestData(mockMedias, mockPersonnes, mockOrganisations);
}

function cleanup() {
  clearData();
}

Deno.test('personnesService.all - returns all personnes with pagination', () => {
  setup();
  try {
    const result = personnesService.all({}, { page: 1, limit: 10 });

    assertEquals(result.data.length, 4);
    assertEquals(result.pagination.total, 4);
    assertEquals(result.pagination.page, 1);
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.all - paginates correctly', () => {
  setup();
  try {
    const result = personnesService.all({}, { page: 1, limit: 2 });

    assertEquals(result.data.length, 2);
    assertEquals(result.pagination.total, 4);
    assertEquals(result.pagination.pages, 2);
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.all - filters by forbes', () => {
  setup();
  try {
    const result = personnesService.all({ forbes: true, annee: 2024 }, {
      page: 1,
      limit: 10
    });

    assertEquals(result.data.length, 2);
    assertEquals(
      result.data.every((p) => p.classements.forbes2024 === true),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.all - filters by challengesMax', () => {
  setup();
  try {
    const result = personnesService.all(
      { challengesMax: 10, annee: 2024 },
      { page: 1, limit: 10 }
    );

    assertEquals(result.data.length, 2);
    assertEquals(
      result.data.every((p) => {
        const rang = p.classements.challenges2024;
        return rang !== null && rang <= 10;
      }),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.all - filters by hasMedias', () => {
  setup();
  try {
    const result = personnesService.all({ hasMedias: true }, {
      page: 1,
      limit: 10
    });

    assertEquals(result.data.length, 3);
    assertEquals(
      result.data.every(
        (p) => p.mediasDirects.length > 0 || p.mediasViaOrganisations.length > 0
      ),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.all - filters with different year', () => {
  setup();
  try {
    const result = personnesService.all(
      { forbes: true, annee: 2023 },
      { page: 1, limit: 10 }
    );

    assertEquals(result.data.length, 3);
    assertEquals(
      result.data.every((p) => p.classements.forbes2023 === true),
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.findByNom - finds personne by exact name', () => {
  setup();
  try {
    const personne = personnesService.findByNom('Xavier Niel');

    assertExists(personne);
    assertEquals(personne.nom, 'Xavier Niel');
    assertEquals(personne.classements.challenges2024, 8);
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.findByNom - case insensitive search', () => {
  setup();
  try {
    const personne = personnesService.findByNom('xavier niel');

    assertExists(personne);
    assertEquals(personne.nom, 'Xavier Niel');
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.findByNom - returns undefined for non-existent personne', () => {
  setup();
  try {
    const personne = personnesService.findByNom('John Doe');

    assertEquals(personne, undefined);
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.topChallenges - returns top ranked personnes', () => {
  setup();
  try {
    const result = personnesService.topChallenges(2024, 10);

    assertEquals(result.length, 4);
    assertEquals(result[0].rang, 1);
    assertEquals(result[0].nom, 'Bernard Arnault');
    assertEquals(result[1].rang, 8);
    assertEquals(result[1].nom, 'Xavier Niel');
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.topChallenges - respects limit', () => {
  setup();
  try {
    const result = personnesService.topChallenges(2024, 2);

    assertEquals(result.length, 2);
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.topChallenges - includes forbes status', () => {
  setup();
  try {
    const result = personnesService.topChallenges(2024, 10);

    const arnault = result.find((p) => p.nom === 'Bernard Arnault');
    assertExists(arnault);
    assertEquals(arnault.forbes, true);

    const drahi = result.find((p) => p.nom === 'Patrick Drahi');
    assertExists(drahi);
    assertEquals(drahi.forbes, false);
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.topChallenges - includes media count', () => {
  setup();
  try {
    const result = personnesService.topChallenges(2024, 10);

    const arnault = result.find((p) => p.nom === 'Bernard Arnault');
    assertExists(arnault);
    assertEquals(arnault.nbMedias, 1);
  } finally {
    cleanup();
  }
});

Deno.test('personnesService.topChallenges - works with different years', () => {
  setup();
  try {
    const result = personnesService.topChallenges(2023, 10);

    assertEquals(result[0].nom, 'Bernard Arnault');
    assertEquals(result[0].rang, 1);
  } finally {
    cleanup();
  }
});
