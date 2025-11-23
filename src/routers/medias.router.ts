import { Hono } from '@hono/hono';
import { mediasService } from '../services/medias.service.ts';

export const mediasRouter = new Hono();

// GET /medias - List all medias with filters
mediasRouter.get('/', (c) => {
  const type = c.req.query('type');
  const prix = c.req.query('prix');
  const echelle = c.req.query('echelle');
  const disparu = c.req.query('disparu');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const sort = c.req.query('sort');
  const order = c.req.query('order') as 'asc' | 'desc' | undefined;

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
  const query = c.req.query('q');

  if (!query || query.length < 2) {
    return c.json(
      { error: { code: 400, message: 'Query must be at least 2 characters' } },
      400
    );
  }

  const results = mediasService.search(query);

  return c.json({
    query,
    results: results.map((m) => ({ nom: m.nom, type: m.type }))
  });
});

// GET /medias/:nom - Get media by name
mediasRouter.get('/:nom', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const media = mediasService.findByNom(nom);

  if (!media) {
    return c.json(
      { error: { code: 404, message: `Média '${nom}' non trouvé` } },
      404
    );
  }

  return c.json(media);
});

// GET /medias/:nom/proprietaires - Get direct owners
mediasRouter.get('/:nom/proprietaires', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const media = mediasService.findByNom(nom);

  if (!media) {
    return c.json(
      { error: { code: 404, message: `Média '${nom}' non trouvé` } },
      404
    );
  }

  return c.json({
    media: media.nom,
    proprietaires: media.proprietaires
  });
});

// GET /medias/:nom/proprietaires-ultimes - Get ultimate owners
mediasRouter.get('/:nom/proprietaires-ultimes', (c) => {
  const nom = decodeURIComponent(c.req.param('nom'));
  const media = mediasService.findByNom(nom);

  if (!media) {
    return c.json(
      { error: { code: 404, message: `Média '${nom}' non trouvé` } },
      404
    );
  }

  return c.json({
    media: media.nom,
    proprietairesUltimes: media.chaineProprietaires
  });
});
