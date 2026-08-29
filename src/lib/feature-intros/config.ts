import type { FeatureIntroConfig, FeatureIntroId } from '@/lib/feature-intros/types';

const configs: Record<FeatureIntroId, FeatureIntroConfig> = {
  scanner: {
    id: 'scanner',
    title: 'Scanner un produit',
    promise: 'Du code produit à la ligne de facture, gardez toujours le contrôle.',
    ctaLabel: 'Scanner maintenant',
    steps: [
      {
        key: 'scan',
        headline: 'Scannez un produit',
        body: 'Identifiez automatiquement vos produits et ajoutez-les à vos factures.',
        durationMs: 1200,
      },
      {
        key: 'identify',
        headline: 'Produit identifié',
        body: 'Nom, référence, prix et TVA apparaissent automatiquement.',
        durationMs: 1200,
      },
      {
        key: 'add',
        headline: 'Ajoutez-le à votre facture',
        body: 'La fiche devient une ligne normale, toujours modifiable.',
        durationMs: 1200,
      },
    ],
  },
  invoice: {
    id: 'invoice',
    title: 'Créer une facture',
    promise: 'Créez une facture claire, calculée et prête à envoyer en trois étapes.',
    ctaLabel: 'Créer une facture',
    steps: [
      {
        key: 'client',
        headline: 'Choisissez un client',
        body: 'Sélectionnez le destinataire de votre facture.',
        durationMs: 1200,
      },
      {
        key: 'lines',
        headline: 'Ajoutez vos produits',
        body: 'Lignes manuelles, scan ou import — tout est possible.',
        durationMs: 1200,
      },
      {
        key: 'done',
        headline: 'Facture prête',
        body: 'Total calculé, prête à envoyer ou encaisser.',
        durationMs: 1200,
      },
    ],
  },
  quote: {
    id: 'quote',
    title: 'Créer un devis',
    promise: 'Préparez une proposition puis convertissez-la sans aucune ressaisie.',
    ctaLabel: 'Créer un devis',
    steps: [
      {
        key: 'client',
        headline: 'Client du devis',
        body: 'Commencez par le destinataire de votre proposition.',
        durationMs: 1200,
      },
      {
        key: 'lines',
        headline: 'Construisez l’offre',
        body: 'Ajoutez vos prestations et ajustez les montants.',
        durationMs: 1200,
      },
      {
        key: 'convert',
        headline: 'Convertissez en facture',
        body: 'Une fois accepté, transformez le devis en un clic.',
        durationMs: 1200,
      },
    ],
  },
  ai: {
    id: 'ai',
    title: 'Assistant IA',
    promise: 'L’IA extrait les informations, puis vous vérifiez chaque ligne avant l’ajout.',
    ctaLabel: 'Essayer l’IA',
    steps: [
      {
        key: 'ask',
        headline: 'Posez votre demande',
        body: 'Photo produit, capture ou instruction — l’assistant vous suit.',
        durationMs: 1200,
      },
      {
        key: 'process',
        headline: 'Analyse en cours',
        body: 'INVEQ extrait les informations utiles sans saisie manuelle.',
        durationMs: 1200,
      },
      {
        key: 'result',
        headline: 'Résultat prêt',
        body: 'Vérifiez, ajustez, puis ajoutez à votre document.',
        durationMs: 1200,
      },
    ],
  },
  templates: {
    id: 'templates',
    title: 'Modèles de facture',
    promise: 'Choisissez un style cohérent et prévisualisez-le avant de l’appliquer.',
    ctaLabel: 'Voir les modèles',
    steps: [
      {
        key: 'pick',
        headline: 'Choisissez un modèle',
        body: 'Plusieurs styles pour coller à votre image de marque.',
        durationMs: 1200,
      },
      {
        key: 'select',
        headline: 'Sélectionnez',
        body: 'Le modèle s’applique à vos prochaines factures.',
        durationMs: 1200,
      },
      {
        key: 'preview',
        headline: 'Aperçu instantané',
        body: 'Visualisez le rendu avant d’envoyer.',
        durationMs: 1200,
      },
    ],
  },
  payments: {
    id: 'payments',
    title: 'Paiements',
    promise: 'Enregistrez chaque règlement et gardez le reste à payer à jour.',
    ctaLabel: 'Compris',
    steps: [
      {
        key: 'invoice',
        headline: 'Facture émise',
        body: 'Suivez chaque facture depuis son écran détail.',
        durationMs: 1200,
      },
      {
        key: 'pay',
        headline: 'Enregistrez un paiement',
        body: 'Montant, mode et date — en quelques secondes.',
        durationMs: 1200,
      },
      {
        key: 'paid',
        headline: 'Statut à jour',
        body: 'La facture passe en payée, le suivi reste clair.',
        durationMs: 1200,
      },
    ],
  },
  statistics: {
    id: 'statistics',
    title: 'Statistiques',
    promise: 'Transformez vos documents en indicateurs simples pour piloter votre activité.',
    ctaLabel: 'Voir mon tableau',
    steps: [
      {
        key: 'data',
        headline: 'Vos données',
        body: 'CA, factures et devis alimentent le tableau de bord.',
        durationMs: 1200,
      },
      {
        key: 'chart',
        headline: 'Visualisez',
        body: 'Graphiques et indicateurs pour lire l’activité d’un coup d’œil.',
        durationMs: 1200,
      },
      {
        key: 'insights',
        headline: 'Pilotez',
        body: 'Repérez les tendances et agissez plus vite.',
        durationMs: 1200,
      },
    ],
  },
};

const requiredFeatureIntroIds = [
  'invoice',
  'quote',
  'scanner',
  'ai',
  'templates',
  'statistics',
] as const satisfies readonly FeatureIntroId[];

export function getFeatureIntroConfig(id: FeatureIntroId): FeatureIntroConfig {
  return configs[id];
}

export function listFeatureIntroConfigs(): FeatureIntroConfig[] {
  return requiredFeatureIntroIds.map((id) => configs[id]);
}
