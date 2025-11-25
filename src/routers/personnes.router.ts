import { Hono } from '@hono/hono';
import { personnesService } from '../services/personnes.service.ts';
import { NotFoundError, ValidationError } from '../errors.ts';
import {
  validateBoolean,
  validateOrder,
  validatePagination,
  validateSort
} from '../utils/validators.ts';
import { sanitizeResourceName } from '../utils/sanitizer.ts';

export const personnesRouter = new Hono();

// GET /personnes - List all persons with filters
personnesRouter.get('/', (c) => {
  // Validate pagination
  const { page, limit } = validatePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Validate sorting
  const sort = validateSort(c.req.query('sort'), 'personnes');
  const order = validateOrder(c.req.query('order'));

  // Validate boolean filters
  const forbes = validateBoolean(c.req.query('forbes'));
  const hasMedias = validateBoolean(c.req.query('has_medias'));

  // Parse numeric filters
  const challengesMaxStr = c.req.query('challenges_max');
  const challengesMax = challengesMaxStr
    ? parseInt(challengesMaxStr)
    : undefined;

  const anneeStr = c.req.query('annee');
  const annee = anneeStr ? parseInt(anneeStr) : undefined;

  const result = personnesService.all(
    {
      forbes,
      challengesMax,
      annee,
      hasMedias
    },
    { page, limit },
    { sort, order }
  );

  return c.json(result);
});

// GET /personnes/top-challenges - Get top Challenges ranking
personnesRouter.get('/top-challenges', (c) => {
  const anneeStr = c.req.query('annee') || '2024';
  const annee = parseInt(anneeStr) as 2021 | 2022 | 2023 | 2024;

  // Validate year
  if (![2021, 2022, 2023, 2024].includes(annee)) {
    throw new ValidationError(
      'Year must be 2021, 2022, 2023, or 2024',
      'annee'
    );
  }

  const { limit } = validatePagination(undefined, c.req.query('limit') || '10');

  const classement = personnesService.topChallenges(annee, limit);

  return c.json({
    annee,
    classement
  });
});

// GET /personnes/:nom - Get person by name
personnesRouter.get('/:nom', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const personne = personnesService.findByNom(nom);

  if (!personne) {
    throw new NotFoundError(`Personne '${nom}' non trouvée`, 'personne');
  }

  return c.json(personne);
});

// GET /personnes/:nom/medias - Get all medias owned by person
personnesRouter.get('/:nom/medias', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const personne = personnesService.findByNom(nom);

  if (!personne) {
    throw new NotFoundError(`Personne '${nom}' non trouvée`, 'personne');
  }

  return c.json({
    personne: personne.nom,
    mediasDirects: personne.mediasDirects,
    mediasViaOrganisations: personne.mediasViaOrganisations,
    total: personne.mediasDirects.length +
      personne.mediasViaOrganisations.length
  });
});

// GET /personnes/:nom/organisations - Get organisations controlled by person
personnesRouter.get('/:nom/organisations', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const personne = personnesService.findByNom(nom);

  if (!personne) {
    throw new NotFoundError(`Personne '${nom}' non trouvée`, 'personne');
  }

  return c.json({
    personne: personne.nom,
    organisations: personne.organisations
  });
});
