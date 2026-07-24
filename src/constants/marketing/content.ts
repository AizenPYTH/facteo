import { MARKETING_CONTACT, MARKETING_HELP_URLS, MARKETING_LEGAL_URLS } from '@/constants/marketing/site';

export const HERO_CONTENT = {
  overline: 'Facturation pour les pros',
  title: 'INVEQ',
  subtitle:
    'Gérez vos devis et factures comme un pro. Clients, signatures et encaissements — pensé pour les artisans, freelances et PME.',
  ctaPrimary: 'Commencer gratuitement',
  ctaSecondary: 'Découvrir les fonctionnalités',
};

export const PRESENTATION_CONTENT = {
  title: 'Tout votre activité, au même endroit',
  subtitle:
    'Fini les tableurs, les PDF perdus et les relances oubliées. INVEQ vous accompagne du premier devis jusqu’au paiement.',
  bullets: [
    'Créez des devis professionnels en quelques minutes',
    'Transformez un devis accepté en facture en un clic',
    'Suivez vos encaissements et vos impayés en temps réel',
    'Accédez à vos documents depuis mobile ou ordinateur',
  ],
};

export const WHY_CONTENT = {
  title: 'Pourquoi choisir INVEQ ?',
  subtitle: 'Un outil conçu pour le terrain, pas pour les comptables.',
  items: [
    {
      title: 'Simplicité',
      description: 'Interface claire, workflows guidés, zéro jargon comptable.',
      icon: 'sparkles',
    },
    {
      title: 'Conformité',
      description: 'Documents structurés, numérotation, mentions légales et archivage.',
      icon: 'shield',
    },
    {
      title: 'Mobilité',
      description: 'Signez, envoyez et encaissez depuis le chantier ou le bureau.',
      icon: 'phone',
    },
    {
      title: 'Fiabilité',
      description: 'Synchronisation cloud, sauvegardes automatiques, données sécurisées.',
      icon: 'cloud',
    },
  ],
};

export const FEATURES_CONTENT = {
  title: 'Fonctionnalités complètes',
  subtitle: 'Tout ce dont vous avez besoin pour facturer sereinement.',
  items: [
    {
      title: 'Gestion clients',
      description: 'Fiches clients, historique, recherche instantanée et import SIRET.',
      icon: 'users',
    },
    {
      title: 'Devis',
      description: 'Création guidée, modèles, statuts et conversion en facture.',
      icon: 'file',
    },
    {
      title: 'Factures',
      description: 'Émission, relances, paiements partiels et suivi des impayés.',
      icon: 'receipt',
    },
    {
      title: 'PDF professionnels',
      description: '21 modèles, logo, couleurs et aperçu fidèle avant envoi.',
      icon: 'pdf',
    },
    {
      title: 'Signature client',
      description: 'Signature tactile sur devis et factures, intégrée au PDF.',
      icon: 'pen',
    },
    {
      title: 'Paiements',
      description: 'Liens de paiement Stripe et suivi des encaissements.',
      icon: 'card',
    },
    {
      title: 'IA Produit',
      description: 'Suggestions intelligentes pour vos lignes de prestation.',
      icon: 'ai',
    },
    {
      title: 'Cloud',
      description: 'Données synchronisées entre mobile, tablette et web.',
      icon: 'sync',
    },
  ],
};

export const MOBILE_CONTENT = {
  title: 'Votre bureau dans votre poche',
  subtitle:
    'Application native iOS et Android. Créez un devis sur le chantier, faites signer le client et envoyez la facture avant de repartir.',
  highlights: ['Notifications en temps réel', 'Mode hors-ligne partiel', 'Interface adaptée au tactile'],
};

export const TESTIMONIALS_CONTENT = {
  title: 'Ils nous font confiance',
  subtitle: 'Des artisans et indépendants utilisent INVEQ au quotidien.',
  items: [
    {
      quote: 'Je gagne au moins 2 heures par semaine sur ma paperasse. Les devis sont enfin propres.',
      author: 'Marc D.',
      role: 'Électricien, Lyon',
    },
    {
      quote: 'Mes clients signent sur place. Plus besoin d’imprimer ni de scanner.',
      author: 'Sophie L.',
      role: 'Designer freelance, Paris',
    },
    {
      quote: 'Le suivi des impayés m’a évité plusieurs oublis. Interface très claire.',
      author: 'Karim B.',
      role: 'Plombier, Marseille',
    },
  ],
};

export const PRICING_CONTENT = {
  title: 'Tarifs simples et transparents',
  subtitle: 'Commencez gratuitement, passez à Premium quand vous êtes prêt.',
  plans: [
    {
      id: 'standard',
      name: 'Standard',
      price: '0 €',
      period: '/ mois',
      description: 'Pour démarrer et tester INVEQ.',
      features: ['Clients illimités', 'Devis et factures', 'PDF et modèles', 'Application mobile'],
      cta: 'Créer un compte',
      highlighted: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '6,99 €',
      period: '/ mois',
      description: 'Pour les professionnels exigeants.',
      features: [
        'Tout Standard',
        'Statistiques avancées',
        'Paiements Stripe',
        'Multi-entreprises',
        'Support prioritaire',
      ],
      cta: 'Essayer Premium',
      highlighted: true,
    },
  ],
};

export const FAQ_CONTENT = {
  title: 'Questions fréquentes',
  items: [
    {
      question: 'INVEQ est-il adapté aux artisans ?',
      answer:
        'Oui. INVEQ est pensé pour les artisans, freelances et TPE qui veulent une facturation simple sans logiciel comptable complexe.',
    },
    {
      question: 'Puis-je utiliser INVEQ sur ordinateur ?',
      answer:
        'Oui. INVEQ est disponible en application web avec une interface desktop optimisée, en plus des apps iOS et Android.',
    },
    {
      question: 'Mes données sont-elles sécurisées ?',
      answer:
        'Vos données sont hébergées sur une infrastructure cloud sécurisée (Supabase), avec chiffrement et sauvegardes.',
    },
    {
      question: 'Puis-je personnaliser mes documents ?',
      answer:
        'Oui. Logo, couleurs, modèles PDF, mentions légales et numérotation sont entièrement personnalisables.',
    },
    {
      question: 'Comment fonctionne la signature ?',
      answer:
        'Votre client signe directement sur l’écran (mobile ou tablette). La signature est intégrée au PDF final.',
    },
    {
      question: 'Puis-je utiliser un code promo ?',
      answer:
        'Oui. Au moment du paiement Stripe Checkout, vous pouvez saisir un code promo si vous en avez un. Les codes sont communiqués ponctuellement par INVEQ.',
    },
    {
      question: 'Puis-je annuler mon abonnement ?',
      answer: 'Oui, à tout moment depuis les paramètres. Aucun engagement.',
    },
  ],
};

export const CTA_CONTENT = {
  title: 'Prêt à simplifier votre facturation ?',
  subtitle: 'Rejoignez les professionnels qui ont choisi INVEQ. Création de compte en 2 minutes.',
  cta: 'Créer mon compte gratuit',
};

export const FOOTER_LINKS = {
  product: [
    { label: 'Fonctionnalités', href: '/#features' },
    { label: 'Tarifs', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
  ],
  company: [
    { label: 'À propos', href: '/#presentation' },
    { label: 'Contact', href: `mailto:${MARKETING_CONTACT.email}` },
    { label: 'Support', href: MARKETING_HELP_URLS.support },
  ],
  legal: [
    { label: 'Confidentialité', href: MARKETING_LEGAL_URLS.privacy },
    { label: 'Conditions d’utilisation', href: MARKETING_LEGAL_URLS.terms },
    { label: 'Mentions légales', href: MARKETING_LEGAL_URLS.legal },
    { label: 'Politique des cookies', href: MARKETING_LEGAL_URLS.cookies },
  ],
} as const;
