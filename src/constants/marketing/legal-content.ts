import type { LegalSection } from '@/components/marketing/legal-document';

export const LEGAL_LAST_UPDATED = '15 juillet 2026';

export const LEGAL_CONTACT = {
  company: 'FACTEO',
  email: 'contact@facteo.app',
  support: 'support@facteo.app',
  dpo: 'dpo@facteo.app',
  website: 'https://facteo.app',
  address: 'France',
} as const;

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'responsable',
    title: '1. Responsable du traitement',
    paragraphs: [
      'FACTEO, accessible à l’adresse facteo.app, est responsable du traitement des données personnelles collectées via l’application mobile, l’application web et le site internet.',
      'Pour toute question relative à la protection de vos données personnelles, vous pouvez nous contacter à l’adresse : contact@facteo.app ou dpo@facteo.app.',
    ],
  },
  {
    id: 'collecte',
    title: '2. Données collectées',
    paragraphs: [
      'Nous collectons uniquement les données nécessaires au fonctionnement du service de facturation et à la gestion de votre compte utilisateur.',
      'Données d’identification : nom, prénom, adresse e-mail, numéro de téléphone (le cas échéant).',
      'Données professionnelles : raison sociale, SIRET, numéro de TVA, adresse postale, coordonnées bancaires professionnelles (IBAN, BIC), logo et signature.',
      'Données clients : informations relatives à vos propres clients que vous saisissez dans l’application (identité, coordonnées, historique commercial).',
      'Données documentaires : devis, factures, lignes de prestation, signatures électroniques, historique d’envoi.',
      'Données de paiement : les transactions sont traitées par Stripe. FACTEO ne stocke jamais vos numéros de carte bancaire complets.',
      'Données techniques : logs de connexion, adresse IP, type d’appareil, version de l’application, cookies de session.',
    ],
  },
  {
    id: 'finalites',
    title: '3. Finalités du traitement',
    paragraphs: [
      'Vos données sont traitées pour les finalités suivantes :',
      '• Fournir le service de facturation, devis et gestion commerciale.',
      '• Créer et gérer votre compte utilisateur et vos espaces entreprise.',
      '• Générer, envoyer et archiver vos documents commerciaux (PDF).',
      '• Traiter les paiements et abonnements Premium via nos prestataires certifiés.',
      '• Assurer le support client et répondre à vos demandes.',
      '• Améliorer la qualité, la sécurité et les performances du produit.',
      '• Respecter nos obligations légales et réglementaires.',
      '• Prévenir la fraude et garantir la sécurité de la plateforme.',
    ],
  },
  {
    id: 'base-legale',
    title: '4. Base légale',
    paragraphs: [
      'Le traitement de vos données repose sur : l’exécution du contrat (utilisation de FACTEO), votre consentement lorsque la réglementation l’exige (cookies non essentiels, communications marketing), et nos intérêts légitimes (sécurité, amélioration du service, prévention de la fraude).',
    ],
  },
  {
    id: 'securite',
    title: '5. Sécurité des données',
    paragraphs: [
      'FACTEO met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des communications (HTTPS/TLS), authentification sécurisée, hébergement cloud certifié (Supabase), sauvegardes régulières, contrôle d’accès par rôles, et surveillance des accès.',
      'En cas de violation de données susceptible d’engendrer un risque pour vos droits, nous vous en informerons dans les délais prévus par le RGPD.',
    ],
  },
  {
    id: 'conservation',
    title: '6. Durée de conservation',
    paragraphs: [
      'Vos données de compte sont conservées pendant toute la durée de votre utilisation de FACTEO, puis supprimées ou anonymisées dans un délai de 30 jours après la clôture de votre compte.',
      'Les documents commerciaux (devis, factures) sont conservés conformément aux obligations légales en matière de comptabilité et de facturation, soit une durée minimale de 10 ans à compter de la clôture de l’exercice comptable.',
      'Les logs techniques sont conservés pour une durée maximale de 12 mois.',
    ],
  },
  {
    id: 'cookies',
    title: '7. Cookies et traceurs',
    paragraphs: [
      'FACTEO utilise des cookies strictement nécessaires au fonctionnement du service (authentification, session, préférences). Des cookies analytiques peuvent être utilisés pour mesurer l’audience, sous réserve de votre consentement.',
      'Pour plus d’informations, consultez notre Politique des cookies.',
    ],
    links: [{ label: 'Politique des cookies', href: '/cookies' }],
  },
  {
    id: 'droits',
    title: '8. Vos droits (RGPD)',
    paragraphs: [
      'Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants :',
      '• Droit d’accès : obtenir la confirmation que vos données sont traitées et en recevoir une copie.',
      '• Droit de rectification : corriger des données inexactes ou incomplètes.',
      '• Droit à l’effacement : demander la suppression de vos données dans les limites légales.',
      '• Droit à la limitation : restreindre le traitement dans certains cas.',
      '• Droit à la portabilité : recevoir vos données dans un format structuré.',
      '• Droit d’opposition : vous opposer au traitement fondé sur l’intérêt légitime.',
      '• Droit de retirer votre consentement à tout moment, sans affecter la licéité du traitement antérieur.',
      'Vous pouvez demander la suppression de votre compte depuis Paramètres dans l’application, ou en écrivant à support@facteo.app depuis l’adresse e-mail associée au compte. Nous traitons la demande sous 30 jours.',
      'Pour exercer vos droits, contactez-nous à contact@facteo.app. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).',
    ],
  },
  {
    id: 'transferts',
    title: '9. Transferts de données',
    paragraphs: [
      'Vos données sont hébergées au sein de l’Union européenne. Lorsque des sous-traitants situés hors UE interviennent, nous nous assurons que des garanties appropriées sont en place (clauses contractuelles types, décisions d’adéquation).',
    ],
  },
  {
    id: 'contact',
    title: '10. Contact',
    paragraphs: [
      'Pour toute question relative à cette politique de confidentialité :',
      `E-mail : ${LEGAL_CONTACT.email}`,
      `Support : ${LEGAL_CONTACT.support}`,
      `Délégué à la protection des données : ${LEGAL_CONTACT.dpo}`,
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'objet',
    title: '1. Objet',
    paragraphs: [
      'Les présentes Conditions Générales d’Utilisation (ci-après « CGU ») régissent l’accès et l’utilisation de l’application FACTEO, du site web facteo.app et de l’ensemble des services associés.',
      'En créant un compte ou en utilisant FACTEO, vous acceptez sans réserve les présentes CGU. Si vous n’acceptez pas ces conditions, vous ne devez pas utiliser le service.',
    ],
  },
  {
    id: 'service',
    title: '2. Description du service',
    paragraphs: [
      'FACTEO est un logiciel de facturation en ligne (SaaS) permettant de gérer clients, devis, factures, signatures électroniques et paiements. Le service est accessible via application mobile (iOS, Android) et application web.',
      'FACTEO est un outil de gestion commerciale. Il ne constitue pas un logiciel de comptabilité certifié et ne remplace pas les conseils d’un expert-comptable ou d’un commissaire aux comptes.',
    ],
  },
  {
    id: 'compte',
    title: '3. Création de compte',
    paragraphs: [
      'L’inscription nécessite une adresse e-mail valide et la création d’un mot de passe sécurisé. Vous devez avoir au moins 18 ans ou disposer de l’autorisation d’un représentant légal.',
      'Vous êtes seul responsable de la confidentialité de vos identifiants. Toute activité réalisée depuis votre compte est réputée effectuée par vous.',
      'Vous vous engagez à fournir des informations exactes, complètes et à les maintenir à jour.',
    ],
  },
  {
    id: 'abonnement',
    title: '4. Abonnement et tarifs',
    paragraphs: [
      'FACTEO propose une offre Standard gratuite avec des fonctionnalités limitées, et une offre Premium payante donnant accès à l’ensemble des fonctionnalités avancées.',
      'Les tarifs en vigueur sont affichés sur le site et dans l’application au moment de la souscription. Les prix sont indiqués en euros, toutes taxes comprises (TTC) pour les consommateurs.',
      'FACTEO se réserve le droit de modifier ses tarifs. Toute modification sera notifiée avec un préavis de 30 jours. En cas de désaccord, vous pouvez résilier votre abonnement avant l’entrée en vigueur du nouveau tarif.',
    ],
  },
  {
    id: 'paiement',
    title: '5. Paiement',
    paragraphs: [
      'Les abonnements Premium sont facturés mensuellement ou annuellement selon l’offre choisie. Le paiement est traité par Stripe, prestataire de paiement sécurisé.',
      'En cas de défaut de paiement, FACTEO se réserve le droit de suspendre l’accès aux fonctionnalités Premium après notification.',
      'Les paiements de vos clients (liens de paiement Stripe) sont traités directement par Stripe. FACTEO n’est pas partie aux transactions entre vous et vos clients.',
    ],
  },
  {
    id: 'utilisation',
    title: '6. Utilisation acceptable',
    paragraphs: [
      'Vous vous engagez à utiliser FACTEO conformément à la loi française et européenne, sans porter atteinte aux droits de tiers.',
      'Il est interdit de : tenter de contourner les mesures de sécurité, utiliser le service à des fins illicites, surcharger intentionnellement les infrastructures, revendre l’accès au service sans autorisation, ou collecter des données d’autres utilisateurs.',
    ],
  },
  {
    id: 'responsabilites',
    title: '7. Responsabilités',
    paragraphs: [
      'Vous êtes seul responsable du contenu des documents que vous créez (devis, factures) et de leur conformité aux obligations légales applicables à votre activité.',
      'FACTEO ne vérifie pas l’exactitude comptable, fiscale ou juridique de vos documents. Vous restez responsable de la conformité de vos factures (mentions obligatoires, TVA, numérotation).',
    ],
  },
  {
    id: 'propriete',
    title: '8. Propriété intellectuelle',
    paragraphs: [
      'FACTEO, son code source, son design, ses logos, icônes et contenus sont la propriété exclusive de FACTEO et sont protégés par le droit de la propriété intellectuelle.',
      'Vous conservez la pleine propriété de vos données commerciales (clients, devis, factures, logos). FACTEO dispose d’une licence limitée pour héberger et traiter vos données aux fins de fournir le service.',
    ],
  },
  {
    id: 'disponibilite',
    title: '9. Disponibilité du service',
    paragraphs: [
      'FACTEO s’efforce d’assurer une disponibilité continue du service, 24h/24 et 7j/7, hors maintenance programmée.',
      'Nous ne garantissons pas une disponibilité ininterrompue. Des interruptions peuvent survenir pour maintenance, mises à jour ou cas de force majeure.',
      'Les maintenances programmées seront, dans la mesure du possible, annoncées à l’avance.',
    ],
  },
  {
    id: 'limitation',
    title: '10. Limitation de responsabilité',
    paragraphs: [
      'FACTEO est fourni « en l’état ». Dans les limites autorisées par la loi, FACTEO ne saurait être tenu responsable des dommages indirects, pertes de données, pertes de chiffre d’affaires ou manque à gagner.',
      'La responsabilité totale de FACTEO est limitée au montant des sommes versées par l’utilisateur au cours des 12 mois précédant le fait générateur.',
    ],
  },
  {
    id: 'resiliation',
    title: '11. Résiliation',
    paragraphs: [
      'Vous pouvez demander la suppression de votre compte à tout moment depuis les paramètres de l’application (contact support). La suppression entraîne la fermeture de votre accès et la suppression ou l’anonymisation de vos données personnelles dans un délai de 30 jours, sous réserve des obligations légales de conservation des documents comptables.',
      'FACTEO peut suspendre ou résilier votre compte en cas de violation des présentes CGU, de non-paiement, ou d’usage abusif du service, après notification lorsque cela est possible.',
    ],
  },
  {
    id: 'modification',
    title: '12. Modification des CGU',
    paragraphs: [
      'FACTEO se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par e-mail ou notification in-app au moins 30 jours avant l’entrée en vigueur des modifications substantielles.',
      'La poursuite de l’utilisation du service après l’entrée en vigueur des modifications vaut acceptation des nouvelles CGU.',
    ],
  },
  {
    id: 'droit',
    title: '13. Droit applicable et litiges',
    paragraphs: [
      'Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité.',
      'À défaut d’accord amiable, les tribunaux compétents du ressort du siège social de FACTEO seront seuls compétents.',
    ],
  },
  {
    id: 'contact',
    title: '14. Contact',
    paragraphs: [
      `Pour toute question relative aux présentes CGU : ${LEGAL_CONTACT.email}`,
      `Support technique : ${LEGAL_CONTACT.support}`,
    ],
  },
];

export const LEGAL_MENTIONS_SECTIONS: LegalSection[] = [
  {
    id: 'editeur',
    title: 'Éditeur du site et de l’application',
    paragraphs: [
      `Raison sociale : ${LEGAL_CONTACT.company}`,
      'Forme juridique : Société en cours de constitution',
      `Siège social : ${LEGAL_CONTACT.address}`,
      `Site web : ${LEGAL_CONTACT.website}`,
      `E-mail : ${LEGAL_CONTACT.email}`,
      `Support : ${LEGAL_CONTACT.support}`,
    ],
  },
  {
    id: 'publication',
    title: 'Directeur de la publication',
    paragraphs: [
      'Le directeur de la publication est le représentant légal de FACTEO.',
    ],
  },
  {
    id: 'hebergement',
    title: 'Hébergement',
    paragraphs: [
      'Données applicatives et base de données : Supabase Inc., infrastructure cloud hébergée en Union européenne.',
      'Site web et export statique : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.',
      'Paiements : Stripe Inc., prestataire certifié PCI-DSS.',
    ],
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    paragraphs: [
      'L’ensemble des éléments composant le site et l’application FACTEO (textes, graphismes, logos, icônes, logiciels, bases de données) est protégé par le droit de la propriété intellectuelle.',
      'Toute reproduction, représentation, modification ou exploitation non autorisée est strictement interdite.',
    ],
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    paragraphs: [
      'Le traitement de vos données personnelles est décrit dans notre Politique de confidentialité.',
    ],
    links: [{ label: 'Politique de confidentialité', href: '/privacy' }],
  },
  {
    id: 'contact',
    title: 'Contact',
    paragraphs: [
      `Pour toute question relative aux mentions légales : ${LEGAL_CONTACT.email}`,
    ],
  },
];

export const COOKIES_SECTIONS: LegalSection[] = [
  {
    id: 'definition',
    title: '1. Qu’est-ce qu’un cookie ?',
    paragraphs: [
      'Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d’un site web ou de l’utilisation d’une application.',
      'Il permet de mémoriser des informations de navigation, des préférences ou des données de session pour améliorer votre expérience utilisateur.',
    ],
  },
  {
    id: 'types',
    title: '2. Types de cookies utilisés',
    paragraphs: [
      'Cookies strictement nécessaires : indispensables au fonctionnement du service (authentification, session utilisateur, sécurité). Ces cookies ne nécessitent pas votre consentement.',
      'Cookies de préférences : mémorisent vos choix (langue, thème) pour personnaliser l’interface.',
      'Cookies analytiques : mesurent l’audience et l’utilisation du produit pour nous aider à l’améliorer. Déposés uniquement avec votre consentement.',
      'Cookies tiers : certains services intégrés (Stripe pour les paiements) peuvent déposer leurs propres cookies. Consultez leurs politiques respectives.',
    ],
  },
  {
    id: 'utilite',
    title: '3. Utilité des cookies',
    paragraphs: [
      'Assurer le bon fonctionnement de l’authentification et de la session utilisateur.',
      'Mémoriser vos préférences d’interface.',
      'Mesurer l’audience et comprendre comment le produit est utilisé (avec consentement).',
      'Garantir la sécurité et prévenir les usages frauduleux.',
    ],
  },
  {
    id: 'consentement',
    title: '4. Gestion du consentement',
    paragraphs: [
      'Lors de votre première visite, un bandeau vous informe de l’utilisation des cookies et vous permet d’accepter ou de refuser les cookies non essentiels.',
      'Vous pouvez modifier vos préférences à tout moment via les paramètres de votre navigateur ou en nous contactant.',
      'Le refus des cookies strictement nécessaires empêche l’utilisation du service.',
    ],
  },
  {
    id: 'gestion',
    title: '5. Comment gérer les cookies',
    paragraphs: [
      'Vous pouvez configurer votre navigateur pour refuser tous les cookies ou être alerté avant qu’un cookie ne soit déposé.',
      'Pour supprimer les cookies existants, utilisez les paramètres de confidentialité de votre navigateur (Chrome, Firefox, Safari, Edge).',
      'Notez que la désactivation de certains cookies peut affecter le fonctionnement du service.',
    ],
  },
  {
    id: 'duree',
    title: '6. Durée de conservation',
    paragraphs: [
      'Les cookies de session expirent à la fermeture du navigateur.',
      'Les cookies persistants ont une durée maximale de 13 mois, conformément aux recommandations de la CNIL.',
    ],
  },
  {
    id: 'contact',
    title: '7. Contact',
    paragraphs: [
      `Pour toute question sur notre utilisation des cookies : ${LEGAL_CONTACT.email}`,
    ],
    links: [
      { label: 'Politique de confidentialité', href: '/privacy' },
      { label: 'Mentions légales', href: '/legal' },
    ],
  },
];
