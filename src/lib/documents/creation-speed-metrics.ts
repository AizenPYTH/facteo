/**
 * Phase 1 — Creation speed metrics (estimated artisan journey).
 * Used for product storytelling and demo proof.
 *
 * Philosophy: fewer decisions, not more UI.
 * Promises: facturer < 1 min · ne jamais saisir 2× · démo < 2 min.
 */

export type CreationSpeedSnapshot = {
  label: string;
  interactions: number;
  estimatedSeconds: number;
  fieldsFilledManually: number;
};

/** Baseline before Loop 2 / Phase 1 (client already known). */
export const CREATION_SPEED_BEFORE: CreationSpeedSnapshot = {
  label: 'Avant Boucle 2',
  interactions: 14,
  estimatedSeconds: 135,
  fieldsFilledManually: 12,
};

/**
 * After Loop 2 with client prefill + smart lines + context memory:
 * open wizard → pick 2–3 suggested lines → glance finalize → send.
 */
export const CREATION_SPEED_AFTER: CreationSpeedSnapshot = {
  label: 'Après Boucle 2',
  interactions: 7,
  estimatedSeconds: 55,
  fieldsFilledManually: 2,
};

/**
 * Phase 1 signature — "Comme la dernière fois" from Accueil / fiche client.
 * Tap CTA → lines + context already filled → finalize → send.
 */
export const CREATION_SPEED_REPLAY: CreationSpeedSnapshot = {
  label: 'Comme la dernière fois (Phase 1)',
  interactions: 4,
  estimatedSeconds: 35,
  fieldsFilledManually: 0,
};

/**
 * Full Phase 1 demo path (cold start):
 * create client (name only) → invoice → 1–2 lines → send → replay next time.
 */
export const PHASE1_DEMO_FIRST_INVOICE: CreationSpeedSnapshot = {
  label: 'Première facture (jour J)',
  interactions: 9,
  estimatedSeconds: 180,
  fieldsFilledManually: 4,
};

export const PHASE1_DEMO_REPLAY: CreationSpeedSnapshot = {
  label: 'Démo replay (2e facture)',
  interactions: 4,
  estimatedSeconds: 35,
  fieldsFilledManually: 0,
};

/** End-to-end demo target: client → devis → facture → replay → envoi < 2 min. */
export const PHASE1_DEMO_FULL = {
  label: 'Démo Phase 1 complète',
  targetSeconds: 120,
  steps: [
    'Créer un client (nom)',
    'Créer un devis (lignes manuelles ou catalogue)',
    'Transformer / créer facture',
    'Comme la dernière fois',
    'Envoyer',
  ] as const,
};

export function creationSpeedDelta() {
  return {
    interactionsSaved:
      CREATION_SPEED_BEFORE.interactions - CREATION_SPEED_REPLAY.interactions,
    secondsSaved:
      CREATION_SPEED_BEFORE.estimatedSeconds - CREATION_SPEED_REPLAY.estimatedSeconds,
    fieldsAvoided:
      CREATION_SPEED_BEFORE.fieldsFilledManually -
      CREATION_SPEED_REPLAY.fieldsFilledManually,
  };
}
