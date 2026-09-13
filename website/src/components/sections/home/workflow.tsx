'use client';

import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, FileText, PenLine, Receipt, Wallet } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Reveal } from '@/components/ui/reveal';
import { DURATION, EASE, spring } from '@/lib/motion';

/**
 * Le parcours réel d'un document dans INVEQ.
 *
 * Trois chapitres qui défilent seuls et restent pilotables au clic. Chaque
 * chapitre décrit une capacité qui existe : création guidée du devis, signature
 * tactile, conversion en facture, suivi des encaissements et relances.
 *
 * Le défilement automatique s'interrompt dès que le visiteur choisit un
 * chapitre — reprendre la main sur une animation et la voir repartir toute
 * seule est le meilleur moyen de perdre le lecteur.
 */

type Step = {
  id: string;
  label: string;
  title: string;
  body: string;
  icon: typeof FileText;
  panel: () => React.ReactElement;
};

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function QuotePanel() {
  return (
    <div className="space-y-3">
      <PanelRow label="Client" value="Dupont Rénovation" />
      <PanelRow label="Validité" value="30 jours" />
      <div className="rounded-xl border border-border bg-slate-50/70 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Prestations
        </p>
        <div className="mt-2 space-y-1.5 text-[13px]">
          <div className="flex justify-between gap-3">
            <span className="truncate text-foreground/85">Prestation de rénovation</span>
            <span className="tnum shrink-0 font-medium">{euro.format(780)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="truncate text-foreground/85">Fournitures et matériaux</span>
            <span className="tnum shrink-0 font-medium">{euro.format(480)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-3 py-2.5">
        <PenLine aria-hidden className="text-emerald-600" size={15} />
        <span className="text-[12.5px] font-medium text-emerald-800">
          Signé par le client sur mobile
        </span>
      </div>
    </div>
  );
}

function InvoicePanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-indigo-50/70 px-3 py-2.5">
        <ArrowRight aria-hidden className="text-primary" size={15} />
        <span className="text-[12.5px] font-medium text-primary">
          Converti depuis DEV-2026-000014
        </span>
      </div>
      <PanelRow label="Numéro" value="FAC-2026-000142" />
      <PanelRow label="Échéance" value="30 jours" />
      <div className="space-y-1.5 rounded-xl border border-border bg-slate-50/70 p-3 text-[13px]">
        <div className="flex justify-between">
          <span className="text-muted">Total HT</span>
          <span className="tnum font-medium">{euro.format(1260)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">TVA 20 %</span>
          <span className="tnum font-medium">{euro.format(252)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5">
          <span className="font-semibold">Total TTC</span>
          <span className="tnum font-semibold text-primary">{euro.format(1512)}</span>
        </div>
      </div>
    </div>
  );
}

function PaymentPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-3 py-3">
        <span className="flex items-center gap-2 text-[12.5px] font-semibold text-emerald-800">
          <Check aria-hidden size={15} strokeWidth={3} />
          Payée
        </span>
        <span className="tnum text-[13px] font-semibold text-emerald-800">{euro.format(1512)}</span>
      </div>
      <PanelRow label="Encaissé ce mois" value={euro.format(4280)} />
      <PanelRow label="En attente" value={euro.format(1240)} />
      <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2.5">
        <p className="text-[12.5px] font-medium text-amber-900">1 facture en retard</p>
        <p className="mt-0.5 text-[11.5px] text-amber-800/80">
          Repérée sur le tableau de bord, à relancer
        </p>
      </div>
    </div>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="tnum font-medium text-foreground">{value}</span>
    </div>
  );
}

const STEPS: Step[] = [
  {
    id: 'devis',
    label: 'Devis',
    title: 'Un devis prêt en quelques minutes',
    body: 'Choisissez le client, ajoutez vos prestations depuis le catalogue, appliquez une remise si besoin. Le client signe du doigt, sur place.',
    icon: FileText,
    panel: QuotePanel,
  },
  {
    id: 'facture',
    label: 'Facture',
    title: 'Le devis accepté devient une facture',
    body: 'Une conversion, et les lignes, les totaux et la TVA suivent. La numérotation reste continue, les mentions légales sont en place.',
    icon: Receipt,
    panel: InvoicePanel,
  },
  {
    id: 'paiement',
    label: 'Paiement',
    title: 'Vous savez qui vous doit quoi',
    body: 'Paiements complets ou partiels, encaissements du mois, impayés à relancer : tout remonte sur le tableau de bord.',
    icon: Wallet,
    panel: PaymentPanel,
  },
];

const AUTO_ADVANCE_MS = 5200;

export function WorkflowSection() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-20% 0px' });
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(false);

  const select = useCallback((index: number) => {
    setActive(index);
    setManual(true);
  }, []);

  useEffect(() => {
    if (reduce || manual || !inView) {
      return;
    }
    const timer = setInterval(() => setActive((i) => (i + 1) % STEPS.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [reduce, manual, inView]);

  const step = STEPS[active];
  const Panel = step.panel;

  return (
    <section className="px-5 py-[var(--section-y)] sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]" id="parcours">
      <div className="mx-auto max-w-6xl" ref={ref}>
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Le parcours
          </p>
          <h2 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">
            Un document, du premier chiffrage au règlement
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Pas trois outils qui se parlent mal. Une seule suite, où chaque étape reprend la
            précédente.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-10">
          <div>
            <div
              aria-label="Étapes du parcours"
              className="flex gap-2 overflow-x-auto pb-1 sm:gap-3"
              role="tablist">
              {STEPS.map((item, index) => {
                const selected = index === active;
                return (
                  <button
                    aria-controls={`panel-${item.id}`}
                    aria-selected={selected}
                    className={`focus-ring relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                      selected
                        ? 'text-primary'
                        : 'text-muted hover:text-foreground'
                    }`}
                    id={`tab-${item.id}`}
                    key={item.id}
                    onClick={() => select(index)}
                    role="tab"
                    type="button">
                    {selected ? (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-full bg-indigo-50 ring-1 ring-inset ring-primary/20"
                        layoutId="workflow-pill"
                        transition={reduce ? { duration: 0 } : spring}
                      />
                    ) : null}
                    <span className="flex items-center gap-2">
                      <item.icon aria-hidden size={14} />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative mt-6 min-h-[9.5rem]">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  key={step.id}
                  transition={{ duration: DURATION.fast, ease: EASE }}>
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                    {step.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {!reduce ? (
              <div aria-hidden className="mt-2 h-0.5 w-full max-w-md overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full bg-primary/60"
                  key={`${step.id}-${manual}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: manual ? 0 : 1 }}
                  style={{ originX: 0 }}
                  transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
                />
              </div>
            ) : null}
          </div>

          <div
            aria-labelledby={`tab-${step.id}`}
            className="surface-card lift p-4 sm:p-5"
            id={`panel-${step.id}`}
            role="tabpanel">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                key={step.id}
                transition={{ duration: DURATION.base, ease: EASE }}>
                <Panel />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
