import { Hono } from '@hono/hono';
import { organisationsService } from '../services/organisations.service.ts';

export const organisationsRouter = new Hono();

// GET /organisations - List all organisations with filters
organisationsRouter.get('/', (c) => {
  const hasMedias = c.req.query('has_medias');
  const hasFiliales = c.req.query('has_filiales');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const sort = c.req.query('sort');
  const order = c.req.query('order') as 'asc' | 'desc' | undefined;

  const result = organisationsService.all(
    {
      hasMedias: hasMedias ? hasMedias === 'true' : undefined,
      hasFiliales: hasFiliales ? hasFiliales === 'true' : undefined
    },
    { page, limit },
    { sort, order }
  );

  return c.json(result);
});

// GET /organisations/:nom - Get organisation by name
organisationsRouter.get('/:nom', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const organisation = organisationsService.findByNom(nom);

  if (!organisation) {
    return c.json(
      { error: { code: 404, message: `Organisation '${nom}' non trouvée` } },
      404
    );
  }

  return c.json(organisation);
});

// GET /organisations/:nom/filiales - Get subsidiaries
organisationsRouter.get('/:nom/filiales', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const organisation = organisationsService.findByNom(nom);

  if (!organisation) {
    return c.json(
      { error: { code: 404, message: `Organisation '${nom}' non trouvée` } },
      404
    );
  }

  return c.json({
    organisation: organisation.nom,
    filiales: organisation.filiales
  });
});

// GET /organisations/:nom/medias - Get medias owned by organisation
organisationsRouter.get('/:nom/medias', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const organisation = organisationsService.findByNom(nom);

  if (!organisation) {
    return c.json(
      { error: { code: 404, message: `Organisation '${nom}' non trouvée` } },
      404
    );
  }

  return c.json({
    organisation: organisation.nom,
    medias: organisation.medias
  });
});

// GET /organisations/:nom/hierarchie - Get full hierarchy
organisationsRouter.get('/:nom/hierarchie', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const organisation = organisationsService.findByNom(nom);

  if (!organisation) {
    return c.json(
      { error: { code: 404, message: `Organisation '${nom}' non trouvée` } },
      404
    );
  }

  return c.json({
    organisation: organisation.nom,
    parents: organisation.proprietaires,
    enfants: organisation.filiales
  });
});
