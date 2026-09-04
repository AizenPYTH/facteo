'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { InvoiceScene } from '@/components/sections/home/invoice-scene';
import { Button } from '@/components/ui/button';
import { APP_REGISTER_URL, IOS_APP_STORE_URL } from '@/lib/constants';
import { DURATION, EASE } from '@/lib/motion';

/**
 * Hero de la page d'accueil.
 *
 * Le produit est le sujet : le texte pose la promesse en trois lignes, la scène
 * de droite montre ce que fait réellement l'application. Le titre précédent se
 * limitait au mot « INVEQ », ce qui n'apprenait rien au visiteur et ne portait
 * aucun signal de recherche.
 *
 * `id="app-name"` est conservé sur un élément contenant littéralement « INVEQ » :
 * la vérification de marque Google OAuth s'appuie dessus.
 */
export function Hero() {
  const reduce = useReducedMotion();

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: { duration: DURATION.slow, delay, ease: EASE },
  });

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-xl lg:max-w-none">
          <motion.p
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur"
            id="app-name"
            {...rise(0)}>
            INVEQ
            <span aria-hidden className="h-1 w-1 rounded-full bg-primary/40" />
            <span className="tracking-[0.12em]">Facturation pour les pros</span>
          </motion.p>

          <motion.h1
            className="mt-6 text-[2.15rem] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[3rem] lg:text-[3.4rem]"
            {...rise(0.06)}>
            Du devis signé
            <br className="hidden sm:block" />{' '}
            <span className="brand-text-gradient">au paiement encaissé.</span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-[1.0625rem]"
            {...rise(0.12)}>
            Devis, factures, relances et facturation électronique. INVEQ suit chaque document
            jusqu’au règlement — sur le chantier comme au bureau.
          </motion.p>

          <motion.div className="mt-9 flex flex-wrap items-center gap-3" {...rise(0.18)}>
            <Button className="group" href={APP_REGISTER_URL}>
              Commencer gratuitement
              <ArrowRight
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                size={16}
              />
            </Button>
            <Button href="/fonctionnalites" variant="secondary">
              Voir le produit
            </Button>
          </motion.div>

          <motion.p className="mt-5 text-[13px] text-muted" {...rise(0.24)}>
            Sans carte bancaire · Application{' '}
            <a
              className="font-medium text-foreground/70 underline decoration-border underline-offset-4 transition-colors hover:text-primary"
              href={IOS_APP_STORE_URL}
              rel="noopener noreferrer"
              target="_blank">
              iOS disponible
            </a>{' '}
            · Vos données restent les vôtres
          </motion.p>
        </div>

        <motion.div
          className="relative"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}>
          <InvoiceScene />
        </motion.div>
      </div>
    </section>
  );
}
