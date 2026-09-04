'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, FileSpreadsheet, Package, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Déroulé visible de l'import tableur.
 *
 * L'import n'affichait qu'un libellé de bouton. On montre les trois étapes que
 * le code exécute réellement :
 *
 * 1. lecture du classeur (`parseWorkbookRows`, avec repli sur la feuille brute) ;
 * 2. normalisation — `parseFlexibleNumber` pour les montants, `parseVat` pour
 *    le taux, et `computePriceHt` quand seul le TTC est fourni ;
 * 3. constitution des fiches produit.
 *
 * Aucune étape n'est inventée : chacune correspond à une fonction du panneau.
 */

const STEPS = [
  { label: 'Lecture du fichier', icon: FileSpreadsheet },
  { label: 'Normalisation TVA et montants', icon: SlidersHorizontal },
  { label: 'Fiches produit', icon: Package },
] as const;

export function ImportProgress({
  importing,
  fileName,
  detectedCount,
}: {
  importing: boolean;
  fileName: string;
  detectedCount: number;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const done = !importing && detectedCount > 0;

  useEffect(() => {
    // Sous « réduire les animations », l'étape est dérivée au rendu : la forcer
    // ici déclencherait un rendu en cascade depuis un effet.
    if (!importing || reduce) {
      return;
    }

    // Rythme indicatif : le parsing est synchrone et ne remonte pas d'étape.
    // On n'affiche donc pas une progression mesurée, mais l'ordre réel des
    // traitements — l'état final s'aligne sur le résultat.
    const timers = [
      setTimeout(() => setStep(1), 450),
      setTimeout(() => setStep(2), 950),
    ];

    return () => {
      timers.forEach(clearTimeout);
      // Remise à zéro à la fin de l'import, pour que le suivant reparte du début.
      setStep(0);
    };
  }, [importing, reduce]);

  if (!importing && !done) {
    return null;
  }

  const active = done || reduce ? STEPS.length - 1 : step;

  return (
    <motion.div
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden rounded-[var(--radius-app-card)] border border-app-border bg-app-subtle p-3.5"
      initial={{ opacity: 0, height: 0 }}>
      <p className="truncate text-[12px] font-medium text-app-text-2">
        {done ? `${detectedCount} ligne(s) prête(s)` : 'Import en cours…'}
        {fileName ? <span className="font-normal text-app-muted"> · {fileName}</span> : null}
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        {STEPS.map((entry, index) => {
          const reached = done || index <= active;
          const Icon = entry.icon;
          return (
            <div className="flex flex-1 items-center gap-1.5" key={entry.label}>
              <motion.div
                animate={{ opacity: reached ? 1 : 0.4 }}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-app-field)] border px-2 py-1.5 transition-colors ${
                  reached
                    ? 'border-app-accent-border bg-app-surface'
                    : 'border-app-border-dashed bg-transparent'
                }`}
                initial={false}
                transition={{ duration: 0.2 }}>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    reached ? 'bg-app-accent-tint text-app-accent' : 'bg-app-hover text-app-faint'
                  }`}>
                  {done && index === STEPS.length - 1 ? (
                    <Check size={11} strokeWidth={3} />
                  ) : (
                    <Icon size={11} />
                  )}
                </span>
                <span className="truncate text-[10.5px] font-medium text-app-text-2">
                  {entry.label}
                </span>
              </motion.div>

              {index < STEPS.length - 1 ? (
                <ArrowRight
                  className={reached ? 'shrink-0 text-app-accent' : 'shrink-0 text-app-faint'}
                  size={12}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {done ? (
          <motion.p
            animate={{ opacity: 1 }}
            className="mt-2.5 text-[11.5px] leading-snug text-app-muted"
            initial={{ opacity: 0 }}
            key="hint">
            Le premier élément pré-remplit le formulaire. Utilisez « Créer le lot » plus bas pour
            enregistrer l’ensemble.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
