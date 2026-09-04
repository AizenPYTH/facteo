'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Camera, Check, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { DURATION, EASE, spring } from '@/lib/motion';

/**
 * Démonstration de l'analyse d'image du catalogue.
 *
 * Ce que montre la scène est exactement ce que fait l'application : une photo
 * est envoyée, un modèle la lit, et six champs de la fiche produit sont
 * préremplis. Ces six champs sont ceux que `mapAnalysisToFormValues` reporte
 * réellement dans le formulaire — l'analyse renvoie aussi la marque et le
 * modèle, mais l'application ne les applique pas, ils ne figurent donc pas ici.
 *
 * Rien d'autre n'est suggéré : l'IA ne rédige pas de facture, ne relance pas un
 * client et ne lit pas les factures reçues. Ce sont les trois automatisations
 * que la concurrence met en avant sur cette requête ; les afficher ici serait
 * une promesse que le produit ne tient pas.
 *
 * La séquence ne tourne que lorsque la scène est visible, et l'état final est
 * rendu directement si l'utilisateur a demandé à réduire les animations.
 */

/** Les six champs réellement préremplis, dans l'ordre d'apparition. */
const EXTRACTED = [
  { label: 'Nom', value: 'Peinture acrylique mate — 10 L' },
  { label: 'Description', value: 'Blanc satiné, intérieur, rendement 12 m²/L' },
  { label: 'Référence', value: 'PA-10L-BLC' },
  { label: 'Unité', value: 'seau' },
  { label: 'Prix HT', value: '48,90 €' },
  { label: 'TVA', value: '20 %' },
] as const;

const STEP_MS = 300;
const SCAN_MS = 900;
const HOLD_MS = 2600;

type Phase = 'idle' | 'scanning' | 'filling' | 'done';

function usePlayback(active: boolean, reduce: boolean) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (reduce || !active) return;

    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const run = () => {
      setPhase('scanning');
      setFilled(0);

      timers.push(
        setTimeout(() => {
          setPhase('filling');
          EXTRACTED.forEach((_, index) => {
            timers.push(
              setTimeout(() => setFilled(index + 1), index * STEP_MS),
            );
          });
          timers.push(
            setTimeout(() => setPhase('done'), EXTRACTED.length * STEP_MS + 200),
          );
          timers.push(
            setTimeout(run, EXTRACTED.length * STEP_MS + HOLD_MS),
          );
        }, SCAN_MS),
      );
    };

    const start = setTimeout(run, 400);
    return () => {
      clearTimeout(start);
      timers.forEach(clearTimeout);
    };
  }, [active, reduce]);

  // Sous « réduire les animations », l'état final est dérivé au rendu plutôt que
  // posé par un effet : le forcer déclencherait un rendu en cascade.
  if (reduce) return { phase: 'done' as Phase, filled: EXTRACTED.length };
  return { phase, filled };
}

/** Illustration tenant lieu de photo : stylisée, jamais présentée comme une capture. */
function PhotoPlaceholder() {
  return (
    <svg
      aria-hidden
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 120 120">
      <defs>
        <linearGradient id="ai-scene-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#EEF2F7" />
          <stop offset="100%" stopColor="#DCE3EC" />
        </linearGradient>
        <linearGradient id="ai-scene-can" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C9D3E0" />
        </linearGradient>
      </defs>
      <rect fill="url(#ai-scene-bg)" height="120" width="120" />
      <ellipse cx="60" cy="102" fill="#0B0E14" opacity="0.08" rx="30" ry="6" />
      <path
        d="M38 44h44v50a8 8 0 0 1-8 8H46a8 8 0 0 1-8-8Z"
        fill="url(#ai-scene-can)"
        stroke="#94A3B8"
        strokeWidth="1.5"
      />
      <ellipse cx="60" cy="44" fill="#F1F5F9" rx="22" ry="6" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M44 38c6-9 26-9 32 0" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
      <rect fill="#0B0E14" height="14" opacity="0.06" rx="2" width="30" x="45" y="62" />
      <rect fill="#0B0E14" height="4" opacity="0.05" rx="2" width="20" x="50" y="82" />
    </svg>
  );
}

export function AiCatalogScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion() ?? false;
  const { phase, filled } = usePlayback(inView, reduce);

  const scanning = phase === 'scanning';
  const done = phase === 'done';

  return (
    <div
      className="rounded-3xl border border-border bg-surface p-4 shadow-[0_30px_70px_-45px_rgba(11,14,20,0.5)] sm:p-6"
      ref={ref}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,168px)_minmax(0,1fr)] sm:gap-6">
        {/* La photo */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            <Camera size={12} />
            Votre photo
          </p>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-background">
            <PhotoPlaceholder />

            {scanning ? (
              <>
                <motion.div
                  animate={{ y: ['-14%', '114%'] }}
                  className="pointer-events-none absolute inset-x-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(37,99,235,0.42),transparent)]"
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-primary/40" />
              </>
            ) : null}

            {done ? (
              <motion.span
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                transition={spring}>
                <Check size={13} strokeWidth={3.5} />
              </motion.span>
            ) : null}
          </div>
        </div>

        {/* La fiche produit qui se remplit */}
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            <Sparkles size={12} />
            {scanning ? 'Lecture de l’image…' : done ? 'Fiche préremplie' : 'Fiche produit'}
          </p>

          <ul className="space-y-1.5">
            {EXTRACTED.map((field, index) => {
              const shown = index < filled;
              return (
                <li
                  className="flex items-baseline justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2"
                  key={field.label}>
                  <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                    {field.label}
                  </span>
                  <span className="min-w-0 text-right text-[13px] font-medium text-foreground">
                    {shown ? (
                      <motion.span
                        animate={{ opacity: 1, y: 0 }}
                        className="block truncate"
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 4 }}
                        transition={{ duration: DURATION.fast, ease: EASE }}>
                        {field.value}
                      </motion.span>
                    ) : (
                      <span
                        aria-hidden
                        className="block h-3 w-24 rounded-full bg-border/70 sm:w-32"
                      />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            Vous relisez, vous corrigez ce qui doit l’être, vous enregistrez. La fiche rejoint
            votre catalogue et devient disponible sur vos devis et vos factures.
          </p>
        </div>
      </div>
    </div>
  );
}
