'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2, Inbox, Send } from 'lucide-react';

import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { DURATION, EASE } from '@/lib/motion';
import { MANDATE } from '@/lib/content';

const ICONS = [Inbox, Send, Building2];

/**
 * L'échéance de la facturation électronique.
 *
 * Remplace la section de témoignages, dont les trois avis étaient inventés.
 * Le calendrier ci-dessous est un fait public — réforme française de la
 * facturation électronique — et c'est la vraie raison pour laquelle un
 * indépendant s'équipe aujourd'hui.
 *
 * Rien n'est affirmé sur INVEQ au-delà de ce que fait l'application : elle se
 * connecte à une plateforme agréée, elle ne l'est pas elle-même.
 */
export function MandateSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-[#0B0E14] px-5 py-[var(--section-y)] text-white sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 15% 0%, rgba(139,92,246,0.35), transparent 65%), radial-gradient(ellipse 50% 45% at 85% 100%, rgba(37,99,235,0.3), transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
              {MANDATE.overline}
            </p>
            <h2 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
              {MANDATE.title}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
              {MANDATE.subtitle}
            </p>
            <div className="mt-8">
              <Button className="group" href="/facturation-electronique" variant="secondary">
                Comment INVEQ s’y connecte
                <ArrowRight
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  size={16}
                />
              </Button>
            </div>
          </Reveal>

          <RevealGroup className="space-y-3">
            {MANDATE.points.map((point, index) => {
              const Icon = ICONS[index] ?? Inbox;
              return (
                <RevealItem key={point.title}>
                  <motion.div
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
                    whileHover={reduce ? undefined : { y: -2 }}
                    transition={{ duration: DURATION.fast, ease: EASE }}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
                      <Icon aria-hidden size={18} />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold tracking-tight">{point.title}</h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-400">
                        {point.description}
                      </p>
                    </div>
                  </motion.div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
