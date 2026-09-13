'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Déroulé visible de l'analyse par image.
 *
 * L'analyse ne se manifestait que par un libellé de bouton qui changeait :
 * rien ne montrait ce que l'IA faisait, ni ce qu'elle allait remplir. On
 * affiche l'image envoyée, un balayage de lecture, puis les champs au fur et à
 * mesure.
 *
 * Les champs listés sont exactement ceux que `mapAnalysisToFormValues` reporte
 * dans le formulaire, et rien de plus. L'IA renvoie aussi la marque et le
 * modèle, mais le mapper ne les applique pas : les annoncer ici laisserait
 * croire à un remplissage qui n'a pas lieu.
 */

const FILLED_FIELDS = [
  'Nom',
  'Description',
  'Référence',
  'Unité',
  'Prix HT',
  'TVA',
] as const;

export function AiScanProgress({
  previewUrl,
  analyzing,
  done,
  fileCount,
}: {
  previewUrl: string | null;
  analyzing: boolean;
  done: boolean;
  fileCount: number;
}) {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!analyzing) {
      setRevealed(done ? FILLED_FIELDS.length : 0);
      return;
    }

    if (reduce) {
      setRevealed(FILLED_FIELDS.length);
      return;
    }

    // Cadence indicative : l'API ne renvoie pas de progression champ par champ.
    // On ne prétend donc pas suivre l'extraction en direct — c'est une attente
    // rythmée, qui s'aligne sur le résultat dès qu'il arrive.
    setRevealed(0);
    const timers = FILLED_FIELDS.map((_, index) =>
      setTimeout(() => setRevealed((current) => Math.max(current, index + 1)), 420 + index * 260),
    );
    return () => timers.forEach(clearTimeout);
  }, [analyzing, done, reduce]);

  if (!analyzing && !done) {
    return null;
  }

  return (
    <motion.div
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden rounded-[var(--radius-app-card)] border border-app-accent-violet-border bg-app-accent-violet-tint"
      initial={{ opacity: 0, height: 0 }}>
      <div className="flex gap-3 p-3.5">
        <div className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[var(--radius-app-icon)] border border-app-accent-violet-border bg-app-surface">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:), non optimisable par le loader Next
            <img
              alt=""
              className="h-full w-full object-cover"
              src={previewUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-app-accent-violet">
              <Sparkles size={18} />
            </div>
          )}

          {analyzing && !reduce ? (
            <>
              <motion.div
                animate={{ y: ['-12%', '112%'] }}
                className="pointer-events-none absolute inset-x-0 h-6 bg-[linear-gradient(180deg,transparent,rgba(124,58,237,0.55),transparent)]"
                transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-app-accent-violet/40" />
            </>
          ) : null}

          {done ? (
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-app-success text-white shadow-sm"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
              <Check size={11} strokeWidth={3.5} />
            </motion.span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-app-accent-violet">
            <Sparkles size={13} />
            {analyzing
              ? fileCount > 1
                ? `Lecture de ${fileCount} images…`
                : 'Lecture de l’image…'
              : 'Analyse terminée'}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {FILLED_FIELDS.map((field, index) => {
              const shown = index < revealed;
              return (
                <motion.span
                  animate={
                    shown
                      ? { opacity: 1, y: 0 }
                      : reduce
                        ? { opacity: 0.35 }
                        : { opacity: 0.35, y: 2 }
                  }
                  className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                    shown
                      ? 'border-app-accent-violet/30 bg-app-surface text-app-accent-violet'
                      : 'border-app-border-dashed bg-transparent text-app-faint'
                  }`}
                  initial={false}
                  key={field}
                  transition={{ duration: 0.2 }}>
                  {field}
                </motion.span>
              );
            })}
          </div>

          <AnimatePresence>
            {done ? (
              <motion.p
                animate={{ opacity: 1 }}
                className="mt-2 text-[11.5px] leading-snug text-app-text-2"
                initial={{ opacity: 0 }}
                key="hint">
                Vérifiez les valeurs avant d’enregistrer — la marque, la catégorie et le stock
                restent à renseigner.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
