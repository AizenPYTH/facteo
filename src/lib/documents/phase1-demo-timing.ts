/**
 * Phase 1 friction pass — demo timing estimates (artisan, one-handed, mobile).
 *
 * Target: full demo < 120s without explanation.
 * Script: client → devis → facture → Comme la dernière fois → envoyer.
 */

export type DemoStepTiming = {
  step: string;
  estimatedSeconds: number;
  notes: string;
};

export const PHASE1_DEMO_TIMING: DemoStepTiming[] = [
  {
    step: 'Créer un client (Nom + e-mail)',
    estimatedSeconds: 20,
    notes: 'Parcours compact next=invoice — pas de SIREN forcé',
  },
  {
    step: 'Créer un devis (1 ligne + valider)',
    estimatedSeconds: 35,
    notes: 'Atterrit sur le détail, pas la liste',
  },
  {
    step: 'Transformer en facture',
    estimatedSeconds: 8,
    notes: 'CTA primaire dès le brouillon — plus de cycle accepté',
  },
  {
    step: 'Comme la dernière fois',
    estimatedSeconds: 25,
    notes: 'Accueil ou fiche client → lignes préremplies',
  },
  {
    step: 'Envoyer',
    estimatedSeconds: 15,
    notes: 'E-mail visible à la création client',
  },
];

export const PHASE1_DEMO_TOTAL_SECONDS = PHASE1_DEMO_TIMING.reduce(
  (sum, step) => sum + step.estimatedSeconds,
  0,
);

/** 30s Accueil comprehension checklist */
export const PHASE1_THIRTY_SECOND_TEST = [
  'Comment créer une facture ? → Actions rapides / Welcome CTA',
  'Comment reprendre Comme la dernière fois ? → section Accueil ou fiche client',
  'Pourquoi plus rapide ? → un tap reprend tout, zéro retape',
] as const;
