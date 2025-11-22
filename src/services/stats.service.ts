import { getMedias, getOrganisations, getPersonnes } from '../data/index.ts';

export const statsService = {
  global() {
    const medias = getMedias();
    const personnes = getPersonnes();
    const organisations = getOrganisations();

    // Count by type
    const mediasParType: Record<string, number> = {};
    const mediasParPrix: Record<string, number> = {};

    for (const media of medias) {
      // By type
      if (media.type) {
        mediasParType[media.type] = (mediasParType[media.type] || 0) + 1;
      }

      // By price
      if (media.prix) {
        mediasParPrix[media.prix] = (mediasParPrix[media.prix] || 0) + 1;
      }
    }

    return {
      totaux: {
        medias: medias.length,
        personnes: personnes.length,
        organisations: organisations.length
      },
      mediasParType,
      mediasParPrix,
      mediasDisparus: medias.filter((m) => m.disparu).length
    };
  },

  concentration() {
    const personnes = getPersonnes();
    const organisations = getOrganisations();

    // Top persons by media count
    const parPersonnes = personnes
      .map((p) => ({
        nom: p.nom,
        nbMedias: p.mediasDirects.length + p.mediasViaOrganisations.length
      }))
      .filter((p) => p.nbMedias > 0)
      .sort((a, b) => b.nbMedias - a.nbMedias)
      .slice(0, 10);

    // Top organisations by media count
    const parOrganisations = organisations
      .map((o) => ({
        nom: o.nom,
        nbMedias: o.medias.length
      }))
      .filter((o) => o.nbMedias > 0)
      .sort((a, b) => b.nbMedias - a.nbMedias)
      .slice(0, 10);

    return {
      parPersonnes,
      parOrganisations
    };
  }
};
