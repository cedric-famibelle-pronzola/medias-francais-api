import { Hono } from '@hono/hono';
import { organisationsService } from '../services/organisations.service.ts';
import { NotFoundError } from '../errors.ts';
import {
  validateBoolean,
  validateOrder,
  validatePagination,
  validateSort
} from '../utils/validators.ts';
import { sanitizeResourceName } from '../utils/sanitizer.ts';

export const organisationsRouter = new Hono();

// GET /organisations - List all organisations with filters
organisationsRouter.get('/', (c) => {
  // Validate pagination
  const { page, limit } = validatePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Validate sorting
  const sort = validateSort(c.req.query('sort'), 'organisations');
  const order = validateOrder(c.req.query('order'));

  // Validate boolean filters
  const hasMedias = validateBoolean(c.req.query('has_medias'));
  const hasFiliales = validateBoolean(c.req.query('has_filiales'));

  const result = organisationsService.all(
    {
      hasMedias,
      hasFiliales
    },
    { page, limit },
    { sort, order }
  );

  return c.json(result);
});

// GET /organisations/:nom - Get organisation by name
organisationsRouter.get('/:nom', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const organisation = organisationsService.findByNom(nom);

  if (!organisation) {
    throw new NotFoundError(
      `Organisation '${nom}' non trouvée`,
      'organisation'
    );
  }

  return c.json(organisation);
});

// GET /organisations/:nom/filiales - Get subsidiaries
organisationsRouter.get('/:nom/filiales', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const organisation = organisationsService.findByNom(nom);

  if (!organisation) {
    throw new NotFoundError(
      `Organisation '${nom}' non trouvée`,
      'organisation'
    );
  }

  return c.json({
    organisation: organisation.nom,
    filiales: organisation.filiales
  });
});

// GET /organisations/:nom/medias - Get medias owned by organisation
organisationsRouter.get('/:nom/medias', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const organisation = organisationsService.findByNom(nom);

  if (!organisation) {
    throw new NotFoundError(
      `Organisation '${nom}' non trouvée`,
      'organisation'
    );
  }

  return c.json({
    organisation: organisation.nom,
    medias: organisation.medias
  });
});

// GET /organisations/:nom/hierarchie - Get full hierarchy
organisationsRouter.get('/:nom/hierarchie', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const organisation = organisationsService.findByNom(nom);

  if (!organisation) {
    throw new NotFoundError(
      `Organisation '${nom}' non trouvée`,
      'organisation'
    );
  }

  return c.json({
    organisation: organisation.nom,
    parents: organisation.proprietaires,
    enfants: organisation.filiales
  });
});
