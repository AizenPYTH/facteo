import { APP_DASHBOARD_URL, APP_REGISTER_URL, SUPPORT_EMAIL } from './constants';

export const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Support', href: '/support' },
  { label: 'Contact', href: '/contact' },
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
    { title: 'Application web', description: 'Interface desktop optimisée en plus des apps iOS et Android.', icon: 'monitor' },
  ],
};

export const MOBILE = {
  title: 'Votre bureau dans votre poche',
  subtitle:
    'Application native iOS et Android. Créez un devis sur le chantier, faites signer le client et envoyez la facture avant de repartir.',
  highlights: ['Notifications en temps réel', 'Synchronisation cloud', 'Interface adaptée au tactile'],
};

export const TESTIMONIALS = {
  title: 'Ils nous font confiance',
  subtitle: 'Des artisans et indépendants utilisent INVEQ au quotidien.',
  items: [
    { quote: 'Je gagne au moins 2 heures par semaine sur ma paperasse. Les devis sont enfin propres.', author: 'Marc D.', role: 'Électricien, Lyon' },
    { quote: 'Mes clients signent sur place. Plus besoin d’imprimer ni de scanner.', author: 'Sophie L.', role: 'Designer freelance, Paris' },
    { quote: 'Le suivi des impayés m’a évité plusieurs oublis. Interface très claire.', author: 'Karim B.', role: 'Plombier, Marseille' },
  ],
};

/** @deprecated Utiliser SUBSCRIPTION_PRICING_COPY / SUBSCRIPTION_PLANS dans subscription-plans.ts */
export { SUBSCRIPTION_PRICING_COPY as PRICING } from './subscription-plans';

export const FAQ = {
  title: 'Questions fréquentes',
  items: [
    { question: 'INVEQ est-il adapté aux artisans ?', answer: 'Oui. INVEQ est pensé pour les artisans, freelances et TPE qui veulent une facturation simple sans logiciel comptable complexe.' },
    { question: 'Puis-je utiliser INVEQ sur ordinateur ?', answer: 'Oui. INVEQ est disponible en application web avec une interface desktop optimisée, en plus des apps iOS et Android.' },
    { question: 'Mes données sont-elles sécurisées ?', answer: 'Vos données sont hébergées sur une infrastructure cloud sécurisée (Supabase), avec chiffrement et sauvegardes.' },
    { question: 'Puis-je personnaliser mes documents ?', answer: 'Oui. Logo, couleurs, modèles PDF, mentions légales et numérotation sont entièrement personnalisables.' },
    { question: 'Comment fonctionne la signature ?', answer: 'Votre client signe directement sur l’écran (mobile ou tablette). La signature est intégrée au PDF final.' },
    { question: 'Puis-je utiliser un code promo ?', answer: 'Oui. Au moment du paiement Stripe Checkout, vous pouvez saisir un code promo si vous en avez un. Les codes sont communiqués ponctuellement par INVEQ.' },
    { question: 'Puis-je annuler mon abonnement ?', answer: 'Oui, à tout moment depuis les paramètres. Aucun engagement.' },
  ],
};

export const CTA = {
  title: 'Prêt à simplifier votre facturation ?',
  subtitle: 'Rejoignez les professionnels qui ont choisi INVEQ. Création de compte en 2 minutes.',
  cta: 'Créer mon compte gratuit',
};

export const DOWNLOAD = {
  title: 'Téléchargez INVEQ',
  subtitle: 'Disponible sur mobile et web. Vos documents vous suivent partout.',
  platforms: [
    {
      id: 'ios',
      name: 'iOS',
      description: 'Application native pour iPhone et iPad. Idéale sur le terrain.',
      cta: 'Bientôt sur l’App Store',
      href: '#',
      available: false,
    },
    {
      id: 'android',
      name: 'Android',
      description: 'Application native pour smartphones et tablettes Android.',
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
