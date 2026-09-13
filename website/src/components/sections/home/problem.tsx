'use client';

import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal';

/**
 * Le problème, posé sans détour.
 *
 * Remplace les deux sections d'origine — « Tout votre activité, au même
 * endroit » et « Pourquoi choisir INVEQ ? » — qui répétaient la même promesse
 * en deux listes de puces successives. Une seule prise de parole, courte, avant
 * de montrer le produit.
 */

const FRICTIONS = [
  {
    before: 'Un devis rédigé dans un tableur',
    after: 'Un document propre, signé sur place',
  },
  {
    before: 'Une facture retapée à la main depuis le devis',
    after: 'Une conversion, totaux et TVA repris',
  },
  {
    before: 'Des impayés repérés trois mois plus tard',
    after: 'Les retards en tête du tableau de bord',
  },
] as const;

export function ProblemSection() {
  return (
    <section className="border-y border-border/60 bg-white px-5 py-[var(--section-y)] sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]">
      <div className="mx-auto max-w-5xl">
        <Reveal className="max-w-2xl">
          <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">
            La facturation vous coûte des heures.
            <span className="block text-muted">Elle ne devrait pas.</span>
          </h2>
        </Reveal>

        <RevealGroup className="mt-10 space-y-px overflow-hidden rounded-2xl border border-border sm:mt-14" as="ul">
          {FRICTIONS.map((item) => (
            <RevealItem
              as="li"
              className="grid gap-3 bg-white p-5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-6 sm:p-6"
              key={item.before}>
              <span className="text-[14.5px] leading-relaxed text-muted line-through decoration-slate-300 decoration-1">
                {item.before}
              </span>
              <span
                aria-hidden
                className="hidden h-px w-8 bg-gradient-to-r from-border to-primary/40 sm:block"
              />
              <span className="text-[14.5px] font-medium leading-relaxed text-foreground">
                {item.after}
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
