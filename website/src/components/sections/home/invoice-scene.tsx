'use client';

import { AnimatePresence, animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { Check, FileText, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { DURATION, EASE, spring } from '@/lib/motion';

/**
 * Scène produit du hero.
 *
 * Rejoue le parcours réel d'une facture INVEQ : les lignes arrivent, le total
 * se calcule, la TVA s'ajoute, le statut passe de « Brouillon » à « Payée ».
 * Chaque étape correspond à une fonctionnalité qui existe dans l'application —
 * aucune capacité n'est suggérée ici qui n'existe pas.
 *
 * La séquence ne démarre qu'une fois la scène visible et s'arrête dès qu'elle
 * sort de l'écran : une animation qui tourne hors du champ consomme une frame
 * budget pour personne.
 */

const LINES = [
  { label: 'Installation électrique — 3 pièces', qty: '1', total: 1280 },
  { label: 'Mise en conformité tableau', qty: '1', total: 420 },
  { label: 'Déplacement & diagnostic', qty: '1', total: 95 },
] as const;

const VAT_RATE = 0.2;
const SUBTOTAL = LINES.reduce((sum, line) => sum + line.total, 0);
const VAT = SUBTOTAL * VAT_RATE;
const TOTAL = SUBTOTAL + VAT;

/** Étapes de la séquence, dans l'ordre. */
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

const euro = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

function useSequence(active: boolean, reduce: boolean) {
  const [stage, setStage] = useState<Stage>(0);

  useEffect(() => {
    // Sous « réduire les animations », l'étape finale est dérivée au rendu :
    // la forcer ici reviendrait à déclencher un rendu en cascade depuis un effet.
    if (reduce || !active) {
      return;
    }

    // Cadence de la séquence, en millisecondes depuis le démarrage.
    const marks: Array<[number, Stage]> = [
      [250, 1],
      [700, 2],
      [1150, 3],
      [1850, 4],
      [2600, 5],
    ];

    const timers = marks.map(([at, value]) => setTimeout(() => setStage(value), at));
    // Reprise complète : le visiteur qui remonte doit revoir la démonstration.
    const loop = setInterval(() => {
      setStage(0);
      marks.forEach(([at, value]) => setTimeout(() => setStage(value), at));
    }, 9000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [active, reduce]);

  return reduce ? 5 : stage;
}

/** Compteur sur le thread JS — un montant qui se pose vaut mieux qu'un chiffre qui apparaît. */
function useAmount(target: number, run: boolean, reduce: boolean) {
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    if (!run) {
      setValue(0);
      return;
    }
    const controls = animate(0, target, {
      duration: DURATION.slow,
      ease: EASE,
      onUpdate: setValue,
    });
    return () => controls.stop();
  }, [target, run, reduce]);

  return value;
}

export function InvoiceScene() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-10% 0px' });
  const stage = useSequence(inView, reduce);

  const subtotal = useAmount(SUBTOTAL, stage >= 3, reduce);
  const total = useAmount(TOTAL, stage >= 4, reduce);

  const status =
    stage >= 5 ? 'Payée' : stage >= 4 ? 'Envoyée' : 'Brouillon';
  const statusTone =
    stage >= 5
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : stage >= 4
        ? 'bg-indigo-50 text-primary ring-primary/20'
        : 'bg-slate-100 text-slate-500 ring-slate-400/20';

  return (
    <div className="relative" ref={ref}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.18),transparent_70%)] blur-2xl"
      />

      {/* Document principal */}
      <div className="surface-ring relative rounded-[1.25rem] border border-white/60 bg-white/95 p-5 shadow-[var(--shadow-scene)] backdrop-blur-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Facture
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              FAC-2026-0142
            </p>
            <p className="mt-0.5 text-[13px] text-muted">Martin SARL · Paris</p>
          </div>

          <motion.span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors ${statusTone}`}
            key={status}
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}>
            {stage >= 5 ? <Check aria-hidden size={12} strokeWidth={3} /> : null}
            {status}
          </motion.span>
        </div>

        <div className="mt-5 space-y-1.5">
          {LINES.map((line, index) => (
            <motion.div
              className="flex items-baseline justify-between gap-4 rounded-lg px-2.5 py-2 text-[13px] odd:bg-slate-50/70"
              key={line.label}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={
                stage >= 2 || (stage >= 1 && index === 0)
                  ? { opacity: 1, y: 0 }
                  : reduce
                    ? { opacity: 1 }
                    : { opacity: 0, y: 8 }
              }
              transition={{ duration: DURATION.fast, delay: reduce ? 0 : index * 0.12, ease: EASE }}>
              <span className="min-w-0 truncate text-foreground/85">{line.label}</span>
              <span className="tnum shrink-0 font-medium text-foreground">
                {euro.format(line.total)}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-muted">Total HT</span>
            <span className="tnum font-medium text-foreground">{euro.format(subtotal)}</span>
          </div>

          <AnimatePresence initial={false}>
            {stage >= 3 ? (
              <motion.div
                className="flex items-center justify-between"
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE }}>
                <span className="text-muted">TVA 20 %</span>
                <span className="tnum font-medium text-foreground">{euro.format(VAT)}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-semibold text-foreground">Total TTC</span>
            <motion.span
              className="tnum text-lg font-semibold text-primary"
              animate={stage >= 4 && !reduce ? { scale: [1, 1.04, 1] } : {}}
              transition={{ duration: 0.45, ease: EASE }}>
              {euro.format(total)}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Notification de paiement */}
      <AnimatePresence>
        {stage >= 5 ? (
          <motion.div
            className="absolute -bottom-5 -left-3 flex items-center gap-2.5 rounded-xl border border-emerald-200/70 bg-white/95 px-3.5 py-2.5 shadow-[var(--shadow-lift)] backdrop-blur sm:-left-6"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={spring}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check aria-hidden size={14} strokeWidth={3} />
            </span>
            <span className="text-[12px] leading-tight">
              <span className="block font-semibold text-foreground">Paiement reçu</span>
              <span className="tnum text-muted">{euro.format(TOTAL)}</span>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Carte secondaire : la facturation électronique, réellement disponible */}
      <motion.div
        aria-hidden
        className="absolute -right-2 -top-6 hidden items-center gap-2 rounded-xl border border-border/80 bg-white/90 px-3 py-2 shadow-[var(--shadow-card)] backdrop-blur sm:flex lg:-right-6"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, delay: 0.5, ease: EASE }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-primary">
          <FileText aria-hidden size={14} />
        </span>
        <span className="text-[11px] font-medium leading-tight text-foreground">
          Facture électronique
          <span className="block text-[10px] font-normal text-muted">via plateforme agréée</span>
        </span>
      </motion.div>

      {/* Rappel : 21 modèles PDF, chiffre vérifié dans le registre de l'app */}
      <motion.div
        aria-hidden
        className="absolute -bottom-8 right-2 hidden items-center gap-1.5 rounded-full border border-border/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[var(--shadow-card)] backdrop-blur md:flex lg:right-6"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.base, delay: 0.7, ease: EASE }}>
        <Sparkles aria-hidden className="text-primary" size={12} />
        21 modèles de PDF
      </motion.div>
    </div>
  );
}
