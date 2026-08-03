/** Ordre d’affichage canonique des offres INVEQ — jamais alphabétique. */
export const PLAN_DISPLAY_ORDER = ['micro', 'basique', 'standard', 'pro', 'max'] as const;

export type PlanDisplayId = (typeof PLAN_DISPLAY_ORDER)[number];

export function sortPlansByDisplayOrder<T extends { id: string }>(plans: T[]): T[] {
  const rank = new Map(PLAN_DISPLAY_ORDER.map((id, index) => [id, index]));
  return [...plans].sort((a, b) => {
    const left = rank.get(a.id as PlanDisplayId) ?? 999;
    const right = rank.get(b.id as PlanDisplayId) ?? 999;
    return left - right;
  });
}
