/**
 * Contenu de la page publique /facturation-electronique.
 *
 * Règles de vérité :
 * - INVEQ n’est pas une Plateforme Agréée. INVEQ est un logiciel de facturation
 *   qui se connecte à une Plateforme Agréée (SUPER PDP).
 * - Aucune date d’entrée en vigueur, aucune échéance réglementaire, aucun chiffre inventé.
 * - Les caractéristiques de SUPER PDP sont attribuées explicitement à SUPER PDP.
 */

export const E_INVOICING_HERO = {
  overline: 'Facturation électronique',
  title: 'La facturation électronique, sans changer vos habitudes',
  subtitle:
    'La réforme française impose aux entreprises d’émettre et de recevoir leurs factures entre professionnels au format électronique, en passant par une plateforme agréée. INVEQ s’y connecte pour vous, depuis le logiciel que vous utilisez déjà.',
  ctaPrimary: 'Créer mon compte gratuit',
  ctaSecondary: 'Voir comment ça marche',
};

export const E_INVOICING_INTRO = {
  title: 'La facturation électronique, en clair',
  paragraphs: [
    'Une facture électronique n’est pas un PDF envoyé par e-mail. C’est une facture émise dans un format structuré, que les logiciels savent lire automatiquement, et qui circule par un canal encadré plutôt que par votre boîte mail.',
    'La réforme française impose aux entreprises d’émettre et de recevoir leurs factures entre professionnels au format électronique, en passant par une plateforme agréée. Autrement dit : vous ne pouvez plus simplement joindre un PDF à un e-mail pour facturer un autre professionnel — la facture doit transiter par une plateforme agréée.',
    'Concrètement, vous n’avez pas à devenir un expert du sujet. Vous continuez de créer vos devis et vos factures dans INVEQ ; c’est INVEQ qui parle à la plateforme agréée à votre place.',
  ],
  bullets: [
    'Un format structuré, lisible par les logiciels de vos clients',
    'Un canal encadré à la place de la pièce jointe par e-mail',
    'Un même outil pour émettre vos factures et recevoir celles de vos fournisseurs',
  ],
};

export const E_INVOICING_CHANGES = {
  title: 'Ce qui change pour votre entreprise',
  subtitle:
    'Votre métier ne change pas, votre façon de travailler dans INVEQ non plus. Ce qui change, c’est le chemin que prend la facture une fois qu’elle est prête.',
  columns: [
    {
      tone: 'stable' as const,
      title: 'Ce qui ne change pas',
      items: [
        'La façon de créer un devis ou une facture dans INVEQ',
        'Vos modèles, votre logo et vos mentions',
        'Votre catalogue et vos fiches clients',
        'Le PDF que vous envoyez à un particulier',
      ],
    },
    {
      tone: 'change' as const,
      title: 'Ce qui change',
      items: [
        'Les factures entre professionnels transitent par une plateforme agréée',
        'Certaines données deviennent obligatoires sur la facture, notamment l’identification du client',
        'Les factures de vos fournisseurs arrivent elles aussi par ce canal',
        'Chaque facture porte un statut de transmission',
      ],
    },
  ],
};

export const E_INVOICING_CHAIN = {
  title: 'Le trajet d’une facture électronique',
  subtitle:
    'Quatre acteurs, dans cet ordre. Vous n’intervenez qu’à la première étape : le reste se fait depuis INVEQ.',
  steps: [
    {
      name: 'Votre entreprise',
      description:
        'Vous créez votre facture comme d’habitude, à partir d’un devis ou directement dans INVEQ.',
    },
    {
      name: 'INVEQ',
      description:
        'INVEQ prépare la facture au format structuré attendu et la transmet à la plateforme agréée à laquelle votre entreprise est connectée.',
    },
    {
      name: 'Plateforme agréée (SUPER PDP)',
      description:
        'La plateforme agréée contrôle la facture, l’achemine vers le destinataire et renvoie les statuts du cycle de vie.',
    },
    {
      name: 'Votre client',
      description:
        'Votre client reçoit la facture sur sa propre plateforme, dans un format que son logiciel sait traiter.',
    },
  ],
  note: 'INVEQ n’est pas une plateforme agréée : c’est un logiciel de facturation qui se connecte à une plateforme agréée. L’acheminement, les contrôles et les statuts relèvent de la plateforme.',
};

export const E_INVOICING_SUPERPDP = {
  title: 'SUPER PDP, la plateforme agréée à laquelle INVEQ se connecte',
  paragraphs: [
    'SUPER PDP est une Plateforme Agréée (PA / PDP) française, pensée pour être pilotée par API. C’est elle qui prend en charge la partie réglementée du parcours : réception, contrôle, acheminement et retour des statuts.',
    'INVEQ s’y connecte pour que vous n’ayez pas à jongler entre deux outils. Vous restez dans INVEQ pour votre facturation ; SUPER PDP fait le lien avec le reste de l’écosystème.',
  ],
  facts: [
    {
      title: 'Hébergement en France',
      description: 'SUPER PDP indique héberger les données en France.',
    },
    {
      title: 'Formats pris en charge',
      description: 'Selon SUPER PDP : JSON, Factur-X, CII et UBL.',
    },
    {
      title: 'Contrôles à la réception',
      description:
        'SUPER PDP indique valider les factures selon les règles AFNOR XP Z12-012 et EN 16931.',
    },
    {
      title: 'Réseau européen Peppol',
      description: 'SUPER PDP indique être interconnectée aux autres plateformes via Peppol.',
    },
    {
      title: 'Archivage et e-reporting',
      description:
        'SUPER PDP annonce l’archivage des factures et la transmission des données d’e-reporting à l’administration.',
    },
    {
      title: 'Consultation de l’annuaire',
      description:
        'SUPER PDP expose la consultation de l’annuaire des entreprises, utilisée par INVEQ pour vérifier l’adressage d’un client.',
    },
  ],
  disclaimer:
    'Ces éléments sont ceux publiés par SUPER PDP sur son site. INVEQ ne se substitue pas à la plateforme et ne garantit pas ses engagements.',
};

export const E_INVOICING_CONNECTION = {
  title: 'Comment ça fonctionne avec INVEQ',
  subtitle:
    'La connexion se fait une fois, par entreprise. L’inscription, l’autorisation et la vérification d’identité se déroulent chez SUPER PDP, jamais dans INVEQ.',
  steps: [
    {
      title: 'Ouvrez Paramètres → Facturation électronique',
      description:
        'Depuis INVEQ, dans les paramètres de votre entreprise, cliquez sur « Connecter SUPER PDP ».',
      where: 'Dans INVEQ',
    },
    {
      title: 'Vous êtes redirigé vers SUPER PDP',
      description:
        'INVEQ vous envoie sur la plateforme agréée pour que vous autorisiez la connexion vous-même.',
      where: 'Dans INVEQ, puis redirection',
    },
    {
      title: 'Compte, autorisation et vérification d’identité (KYC)',
      description:
        'Sur SUPER PDP : vous créez un compte si vous n’en avez pas, vous autorisez l’accès d’INVEQ, et vous réalisez la vérification d’identité (KYC) de votre entreprise. Cette étape se passe entièrement sur la plateforme : INVEQ ne vous demande jamais vos pièces d’identité.',
      where: 'Chez SUPER PDP',
    },
    {
      title: 'Retour automatique dans INVEQ',
      description:
        'Une fois l’autorisation donnée, vous êtes ramené automatiquement dans INVEQ, sur la page Facturation électronique.',
      where: 'Retour dans INVEQ',
    },
    {
      title: 'Votre entreprise est connectée',
      description:
        'INVEQ peut alors émettre et recevoir vos factures électroniques via SUPER PDP.',
      where: 'Dans INVEQ',
    },
  ],
};

export const E_INVOICING_INVEQ = {
  title: 'Une fois connecté, ce qu’INVEQ fait pour vous',
  items: [
    'Une connexion SUPER PDP par entreprise, gérée depuis vos paramètres',
    'Jetons d’accès stockés chiffrés côté serveur, jamais exposés au navigateur',
    'Recherche dans l’annuaire des entreprises françaises',
    'Émission d’une facture au format structuré',
    'Réception des factures de vos fournisseurs',
    'Suivi des statuts du cycle de vie de vos factures',
  ],
  disclaimer:
    'Le détail et la disponibilité des statuts du cycle de vie dépendent de la plateforme agréée.',
};

export const E_INVOICING_FAQ = {
  title: 'Questions fréquentes',
  items: [
    {
      question: 'INVEQ est-il une plateforme agréée ?',
      answer:
        'Non. INVEQ est un logiciel de facturation qui se connecte à une plateforme agréée. La partie réglementée — contrôle, acheminement, statuts — est assurée par la plateforme agréée, en l’occurrence SUPER PDP.',
    },
    {
      question: 'Dois-je créer un compte chez SUPER PDP ?',
      answer:
        'Oui. La connexion se fait au nom de votre entreprise : vous créez votre compte chez SUPER PDP si vous n’en avez pas, vous autorisez l’accès d’INVEQ, et vous y réalisez la vérification d’identité (KYC). INVEQ ne collecte pas ces éléments et ne réalise aucune vérification d’identité à la place de la plateforme.',
    },
    {
      question: 'Est-ce que je continue d’envoyer des PDF à mes clients particuliers ?',
      answer:
        'Oui. Le PDF envoyé à un particulier ne change pas. Ce sont les factures entre professionnels qui transitent par une plateforme agréée.',
    },
    {
      question: 'Est-ce que ma façon de créer une facture change ?',
      answer:
        'Non. Vous créez vos devis et vos factures dans INVEQ comme aujourd’hui, avec vos modèles, votre logo et vos mentions. Ce qui change, c’est le canal emprunté par la facture une fois qu’elle est prête.',
    },
    {
      question: 'Comment je sais où en est ma facture ?',
      answer:
        'Chaque facture transmise porte un statut de transmission, remonté par la plateforme agréée et affiché dans INVEQ. Le détail et la disponibilité des statuts du cycle de vie dépendent de la plateforme agréée.',
    },
    {
      question: 'Est-ce que je reçois aussi mes factures fournisseurs dans INVEQ ?',
      answer:
        'Oui. Une fois votre entreprise connectée, les factures de vos fournisseurs transmises par ce canal sont récupérées dans INVEQ, en plus de vos factures émises.',
    },
    {
      question: 'Je gère plusieurs entreprises dans INVEQ, comment ça se passe ?',
      answer:
        'La connexion à SUPER PDP se fait par entreprise : une entreprise, une connexion. Vous répétez le parcours de connexion pour chaque entreprise concernée depuis ses propres paramètres.',
    },
  ],
};
