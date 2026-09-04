/**
 * Index des guides.
 *
 * Chaque entrée correspond à un article réellement rédigé. On n'ajoute pas de
 * fiche « à venir » : une page annoncée mais vide déçoit le visiteur et
 * n'apporte rien à l'exploration.
 *
 * Le nombre de guides reste volontairement faible. Neuf sujets traités à fond
 * valent mieux que quarante variations sur les mêmes mots-clés — c'est ce que
 * Google décrit comme un usage abusif du contenu à grande échelle.
 *
 * Les sujets sont choisis sur trois critères conjoints : une intention de
 * recherche réelle, un lien honnête avec ce que fait INVEQ, et une chance
 * raisonnable de dire quelque chose que les pages en place ne disent pas déjà.
 * Un sujet qui ne remplit pas les trois n'entre pas.
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
  {
    slug: 'comment-faire-une-facture',
    title: 'Comment faire une facture : la marche à suivre',
    cardTitle: 'Comment faire une facture',
    description:
      'Les étapes pour émettre une facture valable : ce qu’il faut réunir avant, ce que le document doit porter, comment le numéroter, l’envoyer et le conserver.',
    intent: 'Émettre sa première facture sans rien oublier.',
    readingMinutes: 7,
    published: '2026-09-04',
  },
  {
    slug: 'plateforme-agreee-pdp',
    title: 'Plateforme agréée (ex-PDP) : à quoi elle sert et comment en choisir une',
    cardTitle: 'Plateforme agréée (ex-PDP)',
    description:
      'Ce qu’est une plateforme agréée, pourquoi le terme a remplacé « PDP », ce qu’elle fait concrètement d’une facture, et les points à vérifier avant d’en retenir une.',
    intent: 'Comprendre le rôle des plateformes agréées et savoir laquelle retenir.',
    readingMinutes: 7,
    published: '2026-09-04',
  },
  {
    slug: 'logiciel-facturation-gratuit',
    title: 'Logiciel de facturation gratuit : ce que « gratuit » recouvre vraiment',
    cardTitle: 'Les logiciels de facturation gratuits',
    description:
      'Les offres gratuites sont nombreuses et sincères, mais elles ne sont pas gratuites pour les mêmes raisons. Comment lire une offre avant de s’y installer.',
    intent: 'Choisir une offre gratuite en sachant ce qu’elle finance et où elle s’arrête.',
    readingMinutes: 6,
    published: '2026-09-04',
  },
  {
    slug: 'comparatif-logiciels-facturation',
    title: 'Comparatif des logiciels de facturation français',
    cardTitle: 'Comparatif des logiciels français',
    description:
      'Les principaux outils du marché français ne se distinguent pas par leurs fonctions, mais par le métier qu’ils exercent vraiment. Une lecture par famille, pour se situer.',
    intent: 'Situer les outils les uns par rapport aux autres avant d’en essayer un.',
    readingMinutes: 9,
    published: '2026-09-04',
  },
  {
    slug: 'ia-facturation',
    title: 'L’IA dans un logiciel de facturation : ce qu’elle fait réellement',
    cardTitle: 'L’IA en facturation',
    description:
      'Derrière un même mot se cachent trois usages très différents. Ce que l’intelligence artificielle sait faire aujourd’hui sur une facture, et ce qu’on lui prête à tort.',
    intent: 'Distinguer les usages réels de l’IA en facturation des promesses commerciales.',
    readingMinutes: 7,
    published: '2026-09-04',
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
