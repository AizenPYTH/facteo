export const HERO_CONTENT = {
  overline: 'Facturation nouvelle génération',
  title: 'Gérez vos devis et factures comme un pro.',
  subtitle:
    'FACTEO centralise clients, devis, factures, signatures et paiements. Une application pensée pour les artisans, freelances et PME qui veulent gagner du temps.',
  ctaPrimary: 'Commencer gratuitement',
  ctaSecondary: 'Découvrir les fonctionnalités',
};

export const PRESENTATION_CONTENT = {
  title: 'Tout votre activité, au même endroit',
  subtitle:
    'Fini les tableurs, les PDF perdus et les relances oubliées. FACTEO vous accompagne du premier devis jusqu’au paiement.',
  bullets: [
    'Créez des devis professionnels en quelques minutes',
    'Transformez un devis accepté en facture en un clic',
    'Suivez vos encaissements et vos impayés en temps réel',
    'Accédez à vos documents depuis mobile ou ordinateur',
  ],
};

export const WHY_CONTENT = {
  title: 'Pourquoi choisir FACTEO ?',
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
  subtitle: 'Des artisans et indépendants utilisent FACTEO au quotidien.',
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
      description: 'Pour démarrer et tester FACTEO.',
      features: ['Clients illimités', 'Devis et factures', 'PDF et modèles', 'Application mobile'],
      cta: 'Créer un compte',
      highlighted: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '19 €',
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
      question: 'FACTEO est-il adapté aux artisans ?',
      answer:
        'Oui. FACTEO est pensé pour les artisans, freelances et TPE qui veulent une facturation simple sans logiciel comptable complexe.',
    },
    {
      question: 'Puis-je utiliser FACTEO sur ordinateur ?',
      answer:
        'Oui. FACTEO est disponible en application web avec une interface desktop optimisée, en plus des apps iOS et Android.',
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
      question: 'Puis-je annuler mon abonnement ?',
      answer: 'Oui, à tout moment depuis les paramètres. Aucun engagement.',
    },
  ],
};

export const CTA_CONTENT = {
  title: 'Prêt à simplifier votre facturation ?',
  subtitle: 'Rejoignez les professionnels qui ont choisi FACTEO. Création de compte en 2 minutes.',
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
    { label: 'Contact', href: 'mailto:contact@facteo.app' },
    { label: 'Support', href: 'mailto:support@facteo.app' },
  ],
  legal: [
    { label: 'Confidentialité', href: '/privacy' },
    { label: 'Conditions d’utilisation', href: '/terms' },
    { label: 'Mentions légales', href: '/legal' },
    { label: 'Politique des cookies', href: '/cookies' },
  ],
} as const;
