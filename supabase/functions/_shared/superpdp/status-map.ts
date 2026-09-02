/**
 * SUPER PDP status mapping.
 * Source: official OpenAPI https://api.superpdp.tech/openapi/superpdp.json (status_code schema).
 * SUPER PDP has no exclusive state machine — events accumulate. INVEQ stores a derived summary.
 */

export type InveqElectronicStatus =
  | 'draft'
  | 'ready'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'delivered'
  | 'received'
  | 'paid'
  | 'cancelled'
  | 'error';

/** Documented SUPER PDP → INVEQ mapping (latest event wins by priority below). */
export const SUPERPDP_STATUS_TO_INVEQ: Record<string, InveqElectronicStatus> = {
  'api:uploaded': 'submitted',
  'api:validated': 'submitted',
  'api:sent': 'delivered',
  'api:acknowledged': 'delivered',
  'api:accepted': 'accepted',
  'api:rejected': 'rejected',
  'api:invalid': 'error',
  'api:received': 'received',
  'fr:200': 'submitted',
  'fr:201': 'delivered',
  'fr:202': 'received',
  'fr:203': 'delivered',
  'fr:204': 'accepted',
  'fr:205': 'accepted',
  'fr:206': 'accepted',
  'fr:207': 'rejected',
  'fr:208': 'submitted',
  'fr:209': 'accepted',
  'fr:210': 'rejected',
  'fr:211': 'paid',
  'fr:212': 'paid',
  'fr:213': 'rejected',
  'fr:501': 'rejected',
};

const PRIORITY: Record<InveqElectronicStatus, number> = {
  draft: 0,
  ready: 1,
  submitted: 2,
  delivered: 3,
  received: 3,
  accepted: 4,
  paid: 5,
  rejected: 6,
  error: 6,
  cancelled: 7,
};

export function mapSuperPdpStatus(code: string | null | undefined): InveqElectronicStatus | null {
  if (!code) return null;
  return SUPERPDP_STATUS_TO_INVEQ[code] ?? null;
}

export function deriveElectronicStatusFromEvents(
  statusCodes: string[],
  fallback: InveqElectronicStatus = 'submitted',
): InveqElectronicStatus {
  let best: InveqElectronicStatus = fallback;
  let bestPriority = PRIORITY[fallback] ?? 0;
  for (const code of statusCodes) {
    const mapped = mapSuperPdpStatus(code);
    if (!mapped) continue;
    const priority = PRIORITY[mapped] ?? 0;
    if (priority >= bestPriority) {
      best = mapped;
      bestPriority = priority;
    }
  }
  return best;
}
