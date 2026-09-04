/**
 * Index des guides.
 *
 * Chaque entrée correspond à un article réellement rédigé. On n'ajoute pas de
 * fiche « à venir » : une page annoncée mais vide déçoit le visiteur et
 * n'apporte rien à l'exploration.
 *
 * Le nombre de guides est volontairement faible. Quatre sujets traités à fond
 * valent mieux que quarante variations sur les mêmes mots-clés — c'est ce que
 * Google décrit comme un usage abusif du contenu à grande échelle.
 */

export type Guide = {
  slug: string;
  title: string;
  /** Titre affiché dans les listes, plus court que le H1. */
  cardTitle: string;
  description: string;
  /** Intention de recherche visée, en une phrase. */
  intent: string;
  readingMinutes: number;
  published: string;
};

export const GUIDES: Guide[] = [
  {
    slug: 'mentions-obligatoires-facture',
    title: 'Les mentions obligatoires d’une facture en France',
    cardTitle: 'Mentions obligatoires d’une facture',
    description:
      'La liste des mentions que doit porter une facture entre professionnels : identification, numérotation, désignation, prix, TVA, délais et pénalités.',
    intent: 'Savoir précisément ce qui doit figurer sur une facture pour qu’elle soit conforme.',
    readingMinutes: 6,
    published: '2026-09-04',
  },
  {
    slug: 'devis-ou-facture',
    title: 'Devis ou facture : quelle différence et quand émettre l’un ou l’autre',
    cardTitle: 'Devis ou facture ?',
    description:
      'Le devis engage sur un prix avant la prestation, la facture constate ce qui a été livré et déclenche le paiement. Ce qui les distingue, et comment passer de l’un à l’autre.',
    intent: 'Comprendre le rôle de chaque document et l’ordre dans lequel les émettre.',
    readingMinutes: 5,
    published: '2026-09-04',
  },
  {
    slug: 'facture-electronique-obligation',
    title: 'Facture électronique : qui est concerné et à partir de quand',
    cardTitle: 'L’obligation de facture électronique',
    description:
      'Le calendrier de la réforme française, la différence entre recevoir et émettre, et le rôle des plateformes de dématérialisation.',
    intent: 'Savoir si l’on est concerné, quand, et ce qu’il faut mettre en place.',
    readingMinutes: 6,
    published: '2026-09-04',
  },
  {
    slug: 'choisir-logiciel-facturation',
    title: 'Comment choisir un logiciel de facturation',
    cardTitle: 'Choisir un logiciel de facturation',
    description:
      'Les critères qui comptent vraiment : conformité, continuité devis-facture, suivi des règlements, mobilité, réversibilité des données et coût réel.',
    intent: 'Comparer des outils sur des critères utiles plutôt que sur des listes de fonctions.',
    readingMinutes: 7,
    published: '2026-09-04',
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
