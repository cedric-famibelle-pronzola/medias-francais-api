import { assertEquals, assertExists } from '@std/assert';
import { clearData, setTestData } from '../../src/data/index.ts';
import { statsService } from '../../src/services/stats.service.ts';
import { mockMedias, mockOrganisations, mockPersonnes } from '../setup.ts';

function setup() {
  setTestData(mockMedias, mockPersonnes, mockOrganisations);
}

function cleanup() {
  clearData();
}

Deno.test('statsService.global - returns correct totals', () => {
  setup();
  try {
    const result = statsService.global();

    assertEquals(result.totaux.medias, 5);
    assertEquals(result.totaux.personnes, 4);
    assertEquals(result.totaux.organisations, 3);
  } finally {
    cleanup();
  }
});

Deno.test('statsService.global - counts medias by type', () => {
  setup();
  try {
    const result = statsService.global();

    assertExists(result.mediasParType);
    assertEquals(result.mediasParType['Télévision'], 2);
    assertEquals(result.mediasParType['Radio'], 1);
    assertEquals(
      result.mediasParType['Presse (généraliste  politique  économique)'],
      2
    );
  } finally {
    cleanup();
  }
});

Deno.test('statsService.global - counts medias by prix', () => {
  setup();
  try {
    const result = statsService.global();

    assertExists(result.mediasParPrix);
    assertEquals(result.mediasParPrix['Gratuit'], 3);
    assertEquals(result.mediasParPrix['Payant'], 2);
  } finally {
    cleanup();
  }
});

Deno.test('statsService.global - counts medias disparus', () => {
  setup();
  try {
    const result = statsService.global();

    assertEquals(result.mediasDisparus, 1);
  } finally {
    cleanup();
  }
});

Deno.test('statsService.concentration - returns top personnes by media count', () => {
  setup();
  try {
    const result = statsService.concentration();

    assertExists(result.parPersonnes);
    assertEquals(result.parPersonnes.length, 3);
    assertEquals(
      result.parPersonnes[0].nbMedias >= result.parPersonnes[1].nbMedias,
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('statsService.concentration - excludes personnes without medias', () => {
  setup();
  try {
    const result = statsService.concentration();

    const sansMedia = result.parPersonnes.find((p) =>
      p.nom === 'Personne Sans Media'
    );
    assertEquals(sansMedia, undefined);
  } finally {
    cleanup();
  }
});

Deno.test('statsService.concentration - returns top organisations by media count', () => {
  setup();
  try {
    const result = statsService.concentration();

    assertExists(result.parOrganisations);
    assertEquals(result.parOrganisations.length, 2);
    assertEquals(
      result.parOrganisations[0].nbMedias >=
        result.parOrganisations[1].nbMedias,
      true
    );
  } finally {
    cleanup();
  }
});

Deno.test('statsService.concentration - excludes organisations without medias', () => {
  setup();
  try {
    const result = statsService.concentration();

    const sansMedia = result.parOrganisations.find(
      (o) => o.nom === 'Organisation Sans Media'
    );
    assertEquals(sansMedia, undefined);
  } finally {
    cleanup();
  }
});
