import { CONTACT_EMAIL, IOS_APP_STORE_URL, SITE_NAME, SITE_URL } from '@/lib/constants';

/**
 * Données structurées.
 *
 * Règle appliquée partout ici : un balisage ne décrit que ce qui est réellement
 * visible sur la page. Pas de note d'avis, pas de nombre d'utilisateurs, pas de
 * distinction inventée — Google traite ces écarts comme du balisage trompeur, et
 * ils ne correspondraient à rien dans le produit.
 */

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-inveq.png`,
    email: CONTACT_EMAIL,
    description:
      'INVEQ édite un logiciel de devis et de facturation pour les artisans, les indépendants et les TPE françaises.',
    areaServed: 'FR',
  };
}

/**
 * L'application elle-même.
 *
 * `offers` reprend le prix réel de l'offre d'entrée — 0 € pour Micro, tel que
 * défini dans SUBSCRIPTION_PLANS. On ne déclare ni `aggregateRating` ni
 * `review` : aucun avis vérifié n'existe, et en inventer serait à la fois un
 * balisage trompeur et une pratique commerciale déloyale.
 */
export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Logiciel de facturation',
    operatingSystem: 'iOS, Web',
    url: SITE_URL,
    downloadUrl: IOS_APP_STORE_URL,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${SITE_URL}/#organization` },
    description:
      'Logiciel de devis et de facturation : création de devis, conversion en facture, signature client, suivi des encaissements et facturation électronique via une plateforme agréée.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Offre Micro gratuite, sans limite de durée.',
      url: `${SITE_URL}/tarifs`,
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Questions fréquentes.
 *
 * À n'employer que si les questions et leurs réponses sont visibles dans le
 * corps de la page — c'est la condition posée par Google, et un balisage qui
 * décrirait du contenu masqué serait à retirer.
 */
export function faqSchema(items: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function articleSchema(input: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: `${SITE_URL}${input.path}`,
    mainEntityOfPage: `${SITE_URL}${input.path}`,
    inLanguage: 'fr-FR',
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

/** Sérialise un schéma pour l'injection dans une balise script. */
export function jsonLd(schema: object) {
  return { __html: JSON.stringify(schema) };
}
