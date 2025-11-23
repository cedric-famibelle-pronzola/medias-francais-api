import { Hono } from '@hono/hono';
import { personnesService } from '../services/personnes.service.ts';

export const personnesRouter = new Hono();

// GET /personnes - List all persons with filters
personnesRouter.get('/', (c) => {
  const forbes = c.req.query('forbes');
  const challengesMax = c.req.query('challenges_max');
  const annee = c.req.query('annee');
  const hasMedias = c.req.query('has_medias');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const sort = c.req.query('sort');
  const order = c.req.query('order') as 'asc' | 'desc' | undefined;

  const result = personnesService.all(
    {
      forbes: forbes ? forbes === 'true' : undefined,
      challengesMax: challengesMax ? parseInt(challengesMax) : undefined,
      annee: annee ? parseInt(annee) : undefined,
      hasMedias: hasMedias ? hasMedias === 'true' : undefined
    },
    { page, limit },
    { sort, order }
  );

  return c.json(result);
});

// GET /personnes/top-challenges - Get top Challenges ranking
personnesRouter.get('/top-challenges', (c) => {
  const annee = parseInt(c.req.query('annee') || '2024') as
    | 2021
    | 2022
    | 2023
    | 2024;
  const limit = parseInt(c.req.query('limit') || '10');

  const classement = personnesService.topChallenges(annee, limit);

  return c.json({
    annee,
    classement
  });
});

// GET /personnes/:nom - Get person by name
personnesRouter.get('/:nom', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const personne = personnesService.findByNom(nom);

  if (!personne) {
    return c.json(
      { error: { code: 404, message: `Personne '${nom}' non trouvée` } },
      404
    );
  }

  return c.json(personne);
});

// GET /personnes/:nom/medias - Get all medias owned by person
personnesRouter.get('/:nom/medias', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const personne = personnesService.findByNom(nom);

  if (!personne) {
    return c.json(
      { error: { code: 404, message: `Personne '${nom}' non trouvée` } },
      404
    );
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
  const nom = decodeURIComponent(c.req.param('nom'));
  const personne = personnesService.findByNom(nom);

  if (!personne) {
    return c.json(
      { error: { code: 404, message: `Personne '${nom}' non trouvée` } },
      404
    );
  }

  return c.json({
    personne: personne.nom,
    organisations: personne.organisations
  });
});
