#!/usr/bin/env -S deno run --allow-read --allow-write

// deno-lint-ignore-file no-console

// Types
interface Personne {
  Nom: string;
  rangChallenges2024: string;
  milliardaireForbes2024: string;
  rangChallenges2023: string;
  milliardaireForbes2023: string;
  rangChallenges2022: string;
  milliardaireForbes2022: string;
  rangChallenges2021: string;
  milliardaireForbes2021: string;
}

interface Media {
  Nom: string;
  Type: string;
  Periodicite: string;
  Echelle: string;
  Prix: string;
  Disparu: string;
}

interface Organisation {
  nom: string;
  commentaire: string;
}

interface Relation {
  id: string;
  origine: string;
  qualificatif: string;
  valeur: string;
  cible: string;
  commentaire?: string;
}

interface Proprietaire {
  nom: string;
  type: 'personne' | 'organisation';
  qualificatif: string;
  valeur: string;
}

interface MediaEnrichi {
  nom: string;
  type: string;
  periodicite: string;
  echelle: string;
  prix: string;
  disparu: boolean;
  proprietaires: Proprietaire[];
  chaineProprietaires: ProprietaireUltime[];
}

interface ProprietaireUltime {
  nom: string;
  chemin: string[];
  valeurFinale: string;
}

interface MediaDetenu {
  nom: string;
  type: string;
  qualificatif: string;
  valeur: string;
  via?: string;
}

interface PersonneEnrichie {
  nom: string;
  classements: {
    challenges2024: number | null;
    forbes2024: boolean;
    challenges2023: number | null;
    forbes2023: boolean;
    challenges2022: number | null;
    forbes2022: boolean;
    challenges2021: number | null;
    forbes2021: boolean;
  };
  mediasDirects: MediaDetenu[];
  mediasViaOrganisations: MediaDetenu[];
  organisations: {
    nom: string;
    qualificatif: string;
    valeur: string;
  }[];
}

interface OrganisationEnrichie {
  nom: string;
  commentaire: string;
  proprietaires: Proprietaire[];
  filiales: {
    nom: string;
    qualificatif: string;
    valeur: string;
  }[];
  medias: {
    nom: string;
    type: string;
    qualificatif: string;
    valeur: string;
  }[];
}

// Chargement des données
async function loadJson<T>(path: string): Promise<T[]> {
  const text = await Deno.readTextFile(path);
  return JSON.parse(text);
}

// Fonction pour parser le rang
function parseRang(rang: string): number | null {
  if (!rang) return null;
  return parseInt(rang, 10);
}

// Trouver les propriétaires ultimes d'un média (personnes physiques)
function trouverProprietairesUltimes(
  mediaNom: string,
  personneMediaMap: Map<string, Relation[]>,
  orgMediaMap: Map<string, Relation[]>,
  personneOrgMap: Map<string, Relation[]>,
  orgOrgMap: Map<string, Relation[]>,
  visited: Set<string> = new Set()
): ProprietaireUltime[] {
  const resultats: ProprietaireUltime[] = [];

  // Éviter les boucles infinies
  if (visited.has(mediaNom)) return resultats;
  visited.add(mediaNom);

  // Propriétaires directs (personnes)
  const proprietairesPersonnes = personneMediaMap.get(mediaNom) || [];
  for (const rel of proprietairesPersonnes) {
    resultats.push({
      nom: rel.origine,
      chemin: [rel.origine],
      valeurFinale: rel.valeur
    });
  }

  // Propriétaires organisations
  const proprietairesOrgs = orgMediaMap.get(mediaNom) || [];
  for (const rel of proprietairesOrgs) {
    const chaines = remonterChaineOrg(
      rel.origine,
      personneOrgMap,
      orgOrgMap,
      new Set()
    );

    for (const chaine of chaines) {
      resultats.push({
        nom: chaine.personne,
        chemin: [...chaine.chemin, rel.origine],
        valeurFinale: rel.valeur
      });
    }
  }

  return resultats;
}

// Remonter la chaîne de propriété d'une organisation jusqu'aux personnes
function remonterChaineOrg(
  orgNom: string,
  personneOrgMap: Map<string, Relation[]>,
  orgOrgMap: Map<string, Relation[]>,
  visited: Set<string>
): { personne: string; chemin: string[] }[] {
  const resultats: { personne: string; chemin: string[] }[] = [];

  if (visited.has(orgNom)) return resultats;
  visited.add(orgNom);

  // Personnes propriétaires directes de cette org
  const proprietairesPersonnes = personneOrgMap.get(orgNom) || [];
  for (const rel of proprietairesPersonnes) {
    resultats.push({
      personne: rel.origine,
      chemin: [rel.origine]
    });
  }

  // Organisations propriétaires
  const proprietairesOrgs = orgOrgMap.get(orgNom) || [];
  for (const rel of proprietairesOrgs) {
    const chaines = remonterChaineOrg(
      rel.origine,
      personneOrgMap,
      orgOrgMap,
      new Set(visited)
    );

    for (const chaine of chaines) {
      resultats.push({
        personne: chaine.personne,
        chemin: [...chaine.chemin, rel.origine]
      });
    }
  }

  return resultats;
}

async function main() {
  console.log(
    `%c 📊 Enrichissement des données... `,
    'color: white; background-color: blue; font-weight: bold'
  );

  // Charger les données
  console.log(
    `%c === Chargement des données ===`,
    'color: white; background-color: green; font-weight: bold'
  );

  const personnes = await loadJson<Personne>('dist/main/personnes.json');
  const medias = await loadJson<Media>('dist/main/medias.json');
  const organisations = await loadJson<Organisation>(
    'dist/main/organisations.json'
  );

  const personneMedia = await loadJson<Relation>(
    'dist/detailed/personne-media.json'
  );
  const personneOrg = await loadJson<Relation>(
    'dist/detailed/personne-organisation.json'
  );
  const orgOrg = await loadJson<Relation>(
    'dist/detailed/organisation-organisation.json'
  );
  const orgMedia = await loadJson<Relation>(
    'dist/detailed/organisation-media.json'
  );

  console.log(`  Personnes: ${personnes.length}`);
  console.log(`  Médias: ${medias.length}`);
  console.log(`  Organisations: ${organisations.length}`);

  // Créer les index pour recherche rapide
  console.log(
    `\n%c === Création des index ===`,
    'color: white; background-color: green; font-weight: bold'
  );

  const mediasMap = new Map(medias.map((m) => [m.Nom, m]));

  // Index par cible (pour trouver qui possède quoi)
  const personneMediaMap = new Map<string, Relation[]>();
  for (const rel of personneMedia) {
    const existing = personneMediaMap.get(rel.cible) || [];
    existing.push(rel);
    personneMediaMap.set(rel.cible, existing);
  }

  const orgMediaMap = new Map<string, Relation[]>();
  for (const rel of orgMedia) {
    const existing = orgMediaMap.get(rel.cible) || [];
    existing.push(rel);
    orgMediaMap.set(rel.cible, existing);
  }

  const personneOrgMap = new Map<string, Relation[]>();
  for (const rel of personneOrg) {
    const existing = personneOrgMap.get(rel.cible) || [];
    existing.push(rel);
    personneOrgMap.set(rel.cible, existing);
  }

  const orgOrgMap = new Map<string, Relation[]>();
  for (const rel of orgOrg) {
    const existing = orgOrgMap.get(rel.cible) || [];
    existing.push(rel);
    orgOrgMap.set(rel.cible, existing);
  }

  // Index par origine (pour trouver ce que possède quelqu'un)
  const personneMediaByOrigine = new Map<string, Relation[]>();
  for (const rel of personneMedia) {
    const existing = personneMediaByOrigine.get(rel.origine) || [];
    existing.push(rel);
    personneMediaByOrigine.set(rel.origine, existing);
  }

  const personneOrgByOrigine = new Map<string, Relation[]>();
  for (const rel of personneOrg) {
    const existing = personneOrgByOrigine.get(rel.origine) || [];
    existing.push(rel);
    personneOrgByOrigine.set(rel.origine, existing);
  }

  const orgMediaByOrigine = new Map<string, Relation[]>();
  for (const rel of orgMedia) {
    const existing = orgMediaByOrigine.get(rel.origine) || [];
    existing.push(rel);
    orgMediaByOrigine.set(rel.origine, existing);
  }

  const orgOrgByOrigine = new Map<string, Relation[]>();
  for (const rel of orgOrg) {
    const existing = orgOrgByOrigine.get(rel.origine) || [];
    existing.push(rel);
    orgOrgByOrigine.set(rel.origine, existing);
  }

  console.log(`  Index créés`);

  // Enrichir les médias
  console.log(
    `\n%c === Enrichissement des médias ===`,
    'color: white; background-color: green; font-weight: bold'
  );

  const mediasEnrichis: MediaEnrichi[] = medias.map((media) => {
    const proprietaires: Proprietaire[] = [];

    // Propriétaires personnes
    const propPersonnes = personneMediaMap.get(media.Nom) || [];
    for (const rel of propPersonnes) {
      proprietaires.push({
        nom: rel.origine,
        type: 'personne',
        qualificatif: rel.qualificatif,
        valeur: rel.valeur
      });
    }

    // Propriétaires organisations
    const propOrgs = orgMediaMap.get(media.Nom) || [];
    for (const rel of propOrgs) {
      proprietaires.push({
        nom: rel.origine,
        type: 'organisation',
        qualificatif: rel.qualificatif,
        valeur: rel.valeur
      });
    }

    // Chaîne de propriétaires ultimes
    const chaineProprietaires = trouverProprietairesUltimes(
      media.Nom,
      personneMediaMap,
      orgMediaMap,
      personneOrgMap,
      orgOrgMap
    );

    return {
      nom: media.Nom,
      type: media.Type,
      periodicite: media.Periodicite,
      echelle: media.Echelle,
      prix: media.Prix,
      disparu: media.Disparu === 'oui',
      proprietaires,
      chaineProprietaires
    };
  });

  console.log(`  ${mediasEnrichis.length} médias enrichis`);

  // Enrichir les personnes
  console.log(
    `\n%c === Enrichissement des personnes ===`,
    'color: white; background-color: green; font-weight: bold'
  );

  const personnesEnrichies: PersonneEnrichie[] = personnes.map((personne) => {
    // Médias directs
    const mediasDirects: MediaDetenu[] = [];
    const relMedias = personneMediaByOrigine.get(personne.Nom) || [];
    for (const rel of relMedias) {
      const mediaInfo = mediasMap.get(rel.cible);
      mediasDirects.push({
        nom: rel.cible,
        type: mediaInfo?.Type || '',
        qualificatif: rel.qualificatif,
        valeur: rel.valeur
      });
    }

    // Organisations contrôlées
    const orgsControlees = personneOrgByOrigine.get(personne.Nom) || [];
    const organisationsInfo = orgsControlees.map((rel) => ({
      nom: rel.cible,
      qualificatif: rel.qualificatif,
      valeur: rel.valeur
    }));

    // Médias via organisations
    const mediasViaOrgs: MediaDetenu[] = [];
    for (const orgRel of orgsControlees) {
      const mediasOrg = orgMediaByOrigine.get(orgRel.cible) || [];
      for (const mediaRel of mediasOrg) {
        const mediaInfo = mediasMap.get(mediaRel.cible);
        mediasViaOrgs.push({
          nom: mediaRel.cible,
          type: mediaInfo?.Type || '',
          qualificatif: mediaRel.qualificatif,
          valeur: mediaRel.valeur,
          via: orgRel.cible
        });
      }

      // Médias via sous-organisations
      const sousOrgs = orgOrgByOrigine.get(orgRel.cible) || [];
      for (const sousOrgRel of sousOrgs) {
        const mediasSousOrg = orgMediaByOrigine.get(sousOrgRel.cible) || [];
        for (const mediaRel of mediasSousOrg) {
          const mediaInfo = mediasMap.get(mediaRel.cible);
          mediasViaOrgs.push({
            nom: mediaRel.cible,
            type: mediaInfo?.Type || '',
            qualificatif: mediaRel.qualificatif,
            valeur: mediaRel.valeur,
            via: `${orgRel.cible} → ${sousOrgRel.cible}`
          });
        }
      }
    }

    return {
      nom: personne.Nom,
      classements: {
        challenges2024: parseRang(personne.rangChallenges2024),
        forbes2024: personne.milliardaireForbes2024 !== '',
        challenges2023: parseRang(personne.rangChallenges2023),
        forbes2023: personne.milliardaireForbes2023 !== '',
        challenges2022: parseRang(personne.rangChallenges2022),
        forbes2022: personne.milliardaireForbes2022 !== '',
        challenges2021: parseRang(personne.rangChallenges2021),
        forbes2021: personne.milliardaireForbes2021 !== ''
      },
      mediasDirects,
      mediasViaOrganisations: mediasViaOrgs,
      organisations: organisationsInfo
    };
  });

  console.log(`  ${personnesEnrichies.length} personnes enrichies`);

  // Enrichir les organisations
  console.log(
    `\n%c === Enrichissement des organisations ===`,
    'color: white; background-color: green; font-weight: bold'
  );

  const organisationsEnrichies: OrganisationEnrichie[] = organisations.map(
    (org) => {
      const proprietaires: Proprietaire[] = [];

      // Propriétaires personnes
      const propPersonnes = personneOrgMap.get(org.nom) || [];
      for (const rel of propPersonnes) {
        proprietaires.push({
          nom: rel.origine,
          type: 'personne',
          qualificatif: rel.qualificatif,
          valeur: rel.valeur
        });
      }

      // Propriétaires organisations
      const propOrgs = orgOrgMap.get(org.nom) || [];
      for (const rel of propOrgs) {
        proprietaires.push({
          nom: rel.origine,
          type: 'organisation',
          qualificatif: rel.qualificatif,
          valeur: rel.valeur
        });
      }

      // Filiales
      const filialesRel = orgOrgByOrigine.get(org.nom) || [];
      const filiales = filialesRel.map((rel) => ({
        nom: rel.cible,
        qualificatif: rel.qualificatif,
        valeur: rel.valeur
      }));

      // Médias détenus
      const mediasRel = orgMediaByOrigine.get(org.nom) || [];
      const mediasInfo = mediasRel.map((rel) => {
        const mediaData = mediasMap.get(rel.cible);
        return {
          nom: rel.cible,
          type: mediaData?.Type || '',
          qualificatif: rel.qualificatif,
          valeur: rel.valeur
        };
      });

      return {
        nom: org.nom,
        commentaire: org.commentaire,
        proprietaires,
        filiales,
        medias: mediasInfo
      };
    }
  );

  console.log(`  ${organisationsEnrichies.length} organisations enrichies`);

  // Sauvegarder les données enrichies
  console.log(
    `\n%c === Sauvegarde des données enrichies ===`,
    'color: white; background-color: green; font-weight: bold'
  );

  await Deno.mkdir('dist/enriched', { recursive: true });

  await Deno.writeTextFile(
    'dist/enriched/medias.json',
    JSON.stringify(mediasEnrichis, null, 2)
  );
  console.log(`  → dist/enriched/medias.json`);

  await Deno.writeTextFile(
    'dist/enriched/personnes.json',
    JSON.stringify(personnesEnrichies, null, 2)
  );
  console.log(`  → dist/enriched/personnes.json`);

  await Deno.writeTextFile(
    'dist/enriched/organisations.json',
    JSON.stringify(organisationsEnrichies, null, 2)
  );
  console.log(`  → dist/enriched/organisations.json`);

  // Résumé final
  console.log(
    `\n%c ✅ Enrichissement terminé `,
    'color: white; background-color: green; font-weight: bold'
  );

  console.log(
    `%c    Médias: %c${mediasEnrichis.length} %c| %cPersonnes: %c${personnesEnrichies.length} %c| %cOrganisations: %c${organisationsEnrichies.length}`,
    'color: magenta; font-weight: bold',
    'color: cyan; font-weight: bold',
    'color: gray',
    'color: magenta; font-weight: bold',
    'color: cyan; font-weight: bold',
    'color: gray',
    'color: magenta; font-weight: bold',
    'color: green; font-weight: bold'
  );
}

main().catch((error) => {
  console.error(error);
  Deno.exit(1);
});
