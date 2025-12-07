import { Hono } from '@hono/hono';
import { mediasService } from '../services/medias.service.ts';
import { NotFoundError } from '../errors.ts';
import {
  validateBoolean,
  validateOrder,
  validatePagination,
  validateSearchQuery,
  validateSort
} from '../utils/validators.ts';
import {
  sanitizeResourceName,
  sanitizeSearchQuery
} from '../utils/sanitizer.ts';

export const mediasRouter = new Hono();

// GET /medias - List all medias with filters
mediasRouter.get('/', (c) => {
  // Validate pagination
  const { page, limit } = validatePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Validate sorting
  const sort = validateSort(c.req.query('sort'), 'medias');
  const order = validateOrder(c.req.query('order'));

  // Get filters (sanitization not needed for enums)
  const type = c.req.query('type');
  const prix = c.req.query('prix');
  const echelle = c.req.query('echelle');
  const disparu = c.req.query('disparu');

  const result = mediasService.all(
    {
      type,
      prix,
      echelle,
      disparu: disparu ? disparu === 'true' : undefined
    },
    { page, limit },
    { sort, order }
  );

  return c.json(result);
});

// GET /medias/search - Search medias
mediasRouter.get('/search', (c) => {
  // Validate and sanitize search query
  const rawQuery = c.req.query('q');
  const query = validateSearchQuery(rawQuery);
  const sanitizedQuery = sanitizeSearchQuery(query);

  // Validate extend parameter
  const extend = validateBoolean(c.req.query('extend')) ?? false;

  // Validate sorting parameters
  const sort = validateSort(c.req.query('sort'), 'medias');
  const order = validateOrder(c.req.query('order'));

  const results = mediasService.search(sanitizedQuery, extend, { sort, order });

  return c.json({
    query: sanitizedQuery,
    count: results.length,
    results
  });
});

// GET /medias/:nom - Get media by name
mediasRouter.get('/:nom', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const media = mediasService.findByNom(nom);

  if (!media) {
    throw new NotFoundError(`Média '${nom}' non trouvé`, 'media');
  }

  return c.json(media);
});

// GET /medias/:nom/proprietaires - Get direct owners
mediasRouter.get('/:nom/proprietaires', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const media = mediasService.findByNom(nom);

  if (!media) {
    throw new NotFoundError(`Média '${nom}' non trouvé`, 'media');
  }

  return c.json({
    media: media.nom,
    proprietaires: media.proprietaires
  });
});

// GET /medias/:nom/proprietaires-ultimes - Get ultimate owners
mediasRouter.get('/:nom/proprietaires-ultimes', (c) => {
  const nom = sanitizeResourceName(c.req.param('nom'));
  const media = mediasService.findByNom(nom);

  if (!media) {
    throw new NotFoundError(`Média '${nom}' non trouvé`, 'media');
  }

  return c.json({
    media: media.nom,
    proprietairesUltimes: media.chaineProprietaires
  });
});
