import { APP_DASHBOARD_URL, APP_REGISTER_URL, IOS_APP_STORE_URL, SUPPORT_EMAIL } from './constants';

export const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Facturation électronique', href: '/facturation-electronique' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'FAQ', href: '/faq' },
] as const;

export const HERO = {
  overline: 'Facturation pour les pros',
  /** Doit correspondre exactement au nom OAuth Google Cloud Console */
  title: 'INVEQ',
  subtitle:
    'Logiciel de facturation, devis et gestion pour artisans et PME. Gérez vos devis et factures comme un pro — clients, signatures et encaissements.',
  ctaPrimary: 'Commencer gratuitement',
  ctaSecondary: 'Voir les fonctionnalités',
};

export const PRESENTATION = {
  title: 'Tout votre activité, au même endroit',
  subtitle:
    'Fini les tableurs, les PDF perdus et les relances oubliées. INVEQ vous accompagne du premier devis jusqu’à la facture signée.',
  bullets: [
    'Créez des devis professionnels en quelques minutes',
    'Transformez un devis accepté en facture en un clic',
    'Suivez vos encaissements et vos impayés en temps réel',
    'Accédez à vos documents depuis mobile ou ordinateur',
  ],
};

export const WHY = {
  title: 'Pourquoi choisir INVEQ ?',
  subtitle: 'Un outil conçu pour le terrain, pas pour les comptables.',
  items: [
    { title: 'Simplicité', description: 'Interface claire, workflows guidés, zéro jargon comptable.', icon: 'sparkles' },
    { title: 'Conformité', description: 'Documents structurés, numérotation, mentions légales et archivage.', icon: 'shield' },
    { title: 'Mobilité', description: 'Signez et envoyez vos documents depuis le chantier ou le bureau.', icon: 'smartphone' },
    { title: 'Fiabilité', description: 'Synchronisation cloud, sauvegardes automatiques, données sécurisées.', icon: 'cloud' },
  ],
};

export const FEATURES = {
  title: 'Fonctionnalités complètes',
  subtitle: 'Tout ce dont vous avez besoin pour facturer sereinement.',
  items: [
    { title: 'Gestion clients', description: 'Fiches clients, historique, recherche instantanée et import SIRET.', icon: 'users' },
    { title: 'Devis', description: 'Création guidée, modèles, statuts et conversion en facture.', icon: 'file-text' },
    { title: 'Factures', description: 'Émission, relances, paiements partiels et suivi des impayés.', icon: 'receipt' },
    { title: 'PDF professionnels', description: '21 modèles, logo, couleurs et aperçu fidèle avant envoi.', icon: 'file' },
    { title: 'Signature client', description: 'Signature tactile sur devis et factures, intégrée au PDF.', icon: 'pen-line' },
    { title: 'Statistiques', description: 'Suivez votre CA, vos impayés et l’activité de vos documents.', icon: 'bar-chart' },
    { title: 'Multi-entreprises', description: 'Gérez plusieurs espaces de travail depuis un seul compte.', icon: 'building-2' },
    { title: 'Application web', description: 'Interface desktop optimisée, en plus de l’application iOS.', icon: 'monitor' },
  ],
};

export const MOBILE = {
  title: 'Votre bureau dans votre poche',
  subtitle:
    'Application native iOS, et interface web sur ordinateur. Créez un devis sur le chantier, faites signer le client et envoyez la facture avant de repartir. La version Android est en préparation.',
  highlights: ['Notifications en temps réel', 'Synchronisation cloud', 'Interface adaptée au tactile'],
};

/**
 * Les témoignages précédents étaient inventés — trois personnes et trois
 * citations fabriquées, présentées comme de vrais avis clients. Outre la
 * consigne de ne rien inventer, de faux avis relèvent de la pratique
 * commerciale trompeuse (art. L121-2 du code de la consommation).
 *
 * La section est remplacée par un contenu vérifiable : l'échéance légale de la
 * facturation électronique, qui est un fait public et la vraie raison pour
 * laquelle un artisan s'équipe aujourd'hui.
 */
export const MANDATE = {
  overline: 'Échéance légale',
  title: 'La facture électronique devient obligatoire',
  subtitle:
    'À partir de septembre 2026, toutes les entreprises françaises doivent pouvoir recevoir des factures électroniques. L’émission suit selon la taille de l’entreprise.',
  points: [
    {
      title: 'Recevoir',
      description:
        'Toutes les entreprises, dès septembre 2026, quelle que soit leur taille.',
    },
    {
      title: 'Émettre',
      description:
        'Grandes entreprises et ETI en septembre 2026, PME et microentreprises en septembre 2027.',
    },
    {
      title: 'Par une plateforme agréée',
      description:
        'Les factures transitent par une Plateforme de Dématérialisation Partenaire. INVEQ se connecte à SUPER PDP.',
    },
  ],
};

/** @deprecated Utiliser SUBSCRIPTION_PRICING_COPY / SUBSCRIPTION_PLANS dans subscription-plans.ts */
export { SUBSCRIPTION_PRICING_COPY as PRICING } from './subscription-plans';

export const FAQ = {
  title: 'Questions fréquentes',
  items: [
    { question: 'INVEQ est-il adapté aux artisans ?', answer: 'Oui. INVEQ est pensé pour les artisans, freelances et TPE qui veulent une facturation simple sans logiciel comptable complexe.' },
    { question: 'Puis-je utiliser INVEQ sur ordinateur ?', answer: 'Oui. INVEQ est disponible en application web avec une interface desktop optimisée, en plus de l’application iOS. La version Android est en préparation.' },
    { question: 'Mes données sont-elles sécurisées ?', answer: 'Vos données sont hébergées sur une infrastructure cloud sécurisée (Supabase), avec chiffrement et sauvegardes.' },
    { question: 'Puis-je personnaliser mes documents ?', answer: 'Oui. Logo, couleurs, modèles PDF, mentions légales et numérotation sont entièrement personnalisables.' },
    { question: 'Comment fonctionne la signature ?', answer: 'Votre client signe directement sur l’écran (mobile ou tablette). La signature est intégrée au PDF final.' },
    { question: 'Puis-je utiliser un code promo ?', answer: 'Oui. Au moment du paiement Stripe Checkout, vous pouvez saisir un code promo si vous en avez un. Les codes sont communiqués ponctuellement par INVEQ.' },
    { question: 'Puis-je annuler mon abonnement ?', answer: 'Oui, à tout moment depuis les paramètres. Aucun engagement.' },
  ],
};

export const CTA = {
  title: 'Votre prochain devis peut partir aujourd’hui',
  /* Formulation précédente : « Rejoignez les professionnels qui ont choisi
     INVEQ » — une preuve sociale sans preuve. On s'en tient à ce qui est
     vérifiable : l'offre Micro est bien à 0 € (cf. SUBSCRIPTION_PLANS). */
  subtitle:
    'Création de compte en deux minutes, sans carte bancaire. L’offre Micro est gratuite, sans limite de durée.',
  cta: 'Créer mon compte',
};

export const DOWNLOAD = {
  title: 'Téléchargez INVEQ',
  subtitle: 'Disponible sur mobile et web. Vos documents vous suivent partout.',
  platforms: [
    {
      id: 'ios',
      name: 'iOS',
      description: 'Application native pour iPhone et iPad. Idéale sur le terrain.',
      cta: 'Télécharger sur l’App Store',
      href: IOS_APP_STORE_URL,
      available: true,
    },
    {
      id: 'android',
      name: 'Android',
      description: 'Application Android en préparation. Laissez votre e-mail pour être prévenu de sa sortie.',
      cta: 'Bientôt sur Google Play',
      href: '#',
      available: false,
    },
    {
      id: 'web',
      name: 'Application web',
      description: 'Interface desktop complète, accessible depuis n’importe quel navigateur.',
      cta: 'Ouvrir l’application',
      href: APP_DASHBOARD_URL,
      available: true,
    },
  ],
} as const;

export const FOOTER = {
  product: [
    { label: 'Fonctionnalités', href: '/fonctionnalites' },
    { label: 'Tarifs', href: '/tarifs' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
  ],
  company: [
    { label: 'À propos', href: '/a-propos' },
    { label: 'Contact', href: '/contact' },
    { label: 'Support', href: '/support' },
    { label: 'Carrières', href: '/carrieres' },
    { label: 'Télécharger', href: '/telecharger' },
  ],
  legal: [
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: 'Conditions d’utilisation', href: '/conditions-utilisation' },
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'Cookies', href: '/cookies' },
  ],
};
