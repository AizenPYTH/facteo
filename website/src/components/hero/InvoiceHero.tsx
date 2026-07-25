'use client';

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

import Calculations from '@/components/hero/Calculations';
import ClientHeader from '@/components/hero/ClientHeader';
import LineItemsList from '@/components/hero/LineItemsList';
import PaidStamp from '@/components/hero/PaidStamp';
import PaperContainer from '@/components/hero/PaperContainer';
import PdfBadge from '@/components/hero/PdfBadge';
import SignatureAnimator from '@/components/hero/SignatureAnimator';
import { Button } from '@/components/ui/button';
import { useInvoiceSimulation } from '@/hooks/useInvoiceSimulation';
import { APP_REGISTER_URL } from '@/lib/constants';
import { HERO } from '@/lib/content';

const ease = [0.22, 1, 0.36, 1] as const;

const CLIENT_LOGOS = [
  'Atelier Nord',
  'Lumen Studio',
  'Bâti Pro',
  'Cercle Soft',
  'Maison Verte',
  'Delta Craft',
  'Orion Lab',
  'Forge & Co',
] as const;

export default function InvoiceHero() {
  const sim = useInvoiceSimulation();
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'end start'],
  });
  const floatUp = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [12, -18]);
  const floatDown = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-8, 16]);
  const floatSide = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [6, -10]);

  const toast =
    sim.paid
      ? { title: 'Paiement reçu', detail: '1 435,20 € · Martin SARL' }
      : sim.signed
        ? { title: 'Facture signée', detail: 'Signature client enregistrée' }
        : sim.showPdf
          ? { title: 'PDF généré', detail: 'FAC-2026-0142 prêt à envoyer' }
          : null;

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          {HERO.overline}
        </p>

        <h1 className="mt-5 bg-[linear-gradient(145deg,#a855f7_0%,#6366f1_45%,#2563eb_100%)] bg-clip-text text-[2rem] font-semibold tracking-[-0.04em] text-transparent sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
          {HERO.title}
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {HERO.subtitle}
        </p>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.55, delay: 0.22, ease }}>
          <Button href={APP_REGISTER_URL}>{HERO.ctaPrimary}</Button>
          <Button href="/fonctionnalites" variant="secondary">
            {HERO.ctaSecondary}
          </Button>
        </motion.div>
      </div>

      {/* Social proof — trust signals without competing with the invoice */}
      <motion.div
        animate={{ opacity: 1 }}
        aria-hidden
        className="relative mx-auto mt-12 max-w-4xl overflow-hidden sm:mt-14"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}>
        <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Utilisé par des pros exigeants
        </p>
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#F4F2FF] to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#F4F2FF] to-transparent sm:w-20" />
        <div className="flex overflow-hidden">
          <motion.div
            animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
            className="flex min-w-max items-center gap-8 pr-8"
            transition={
              reduceMotion ? undefined : { duration: 32, ease: 'linear', repeat: Infinity }
            }>
            {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((name, index) => (
              <span
                className="text-sm font-semibold tracking-tight text-foreground/35"
                key={`${name}-${index}`}>
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto mt-12 max-w-[820px] sm:mt-14 lg:mt-16"
        initial={{ opacity: 0, y: 28 }}
        ref={stageRef}
        transition={{ duration: 0.85, delay: 0.28, ease }}>
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 bottom-0 top-1/3 rounded-[40%] bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.12),transparent_70%)] blur-2xl"
        />

        <motion.div
          className="pointer-events-none absolute -left-2 top-10 z-20 hidden lg:block xl:-left-8"
          style={{ y: floatUp }}>
          <FloatChip label="PDF généré" tone="blue" />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute -right-2 top-24 z-20 hidden lg:block xl:-right-6"
          style={{ y: floatDown }}>
          <FloatChip label="Conforme 2026" tone="ink" />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute -left-4 bottom-28 z-20 hidden lg:block xl:-left-10"
          style={{ y: floatSide }}>
          <StatCard hint="+18%" label="CA ce mois" value="12,4 k€" />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute -right-3 bottom-16 z-20 hidden lg:block xl:-right-12"
          style={{ y: floatUp }}>
          <StatCard hint="paiement" label="Délai moyen" value="4 j" />
        </motion.div>

        <AnimatePresence mode="wait">
          {toast ? (
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute -top-3 left-1/2 z-30 w-[min(100%,18rem)] -translate-x-1/2 sm:-top-4 sm:left-auto sm:right-4 sm:translate-x-0"
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              key={toast.title}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}>
              <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/95 px-3.5 py-3 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.45)] backdrop-blur-md">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                  ✓
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                  <p className="truncate text-xs text-muted">{toast.detail}</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <PaperContainer className="relative z-10 w-full">
          <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
            <PdfBadge visible={sim.showPdf} />
            <ClientHeader client={sim.client} />

            <div className="mt-7 sm:mt-8">
              <LineItemsList items={sim.items} revealedCount={sim.revealedCount} />
            </div>

            <div className="mt-6 flex justify-end sm:mt-8">
              <Calculations subtotal={sim.subtotal} tvaRate={sim.tvaRate} />
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-[rgba(15,23,42,0.06)] pt-6 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
              <p className="text-xs text-muted sm:text-sm">Paiement instantané · Signature intégrée</p>
              <div className="relative flex min-h-[52px] items-center justify-end gap-5">
                <SignatureAnimator signed={sim.signed} />
                <PaidStamp paid={sim.paid} />
              </div>
            </div>
          </div>
        </PaperContainer>

        <div className="mt-5 flex flex-wrap justify-center gap-2 lg:hidden">
          <FloatChip label="PDF généré" tone="blue" />
          <FloatChip label="Paiement reçu" tone="green" />
          <FloatChip label="Conforme 2026" tone="ink" />
        </div>
      </motion.div>
    </div>
  );
}

function FloatChip({
  label,
  tone,
}: {
  label: string;
  tone: 'blue' | 'ink' | 'green';
}) {
  const tones = {
    blue: 'border-blue-100 bg-white/95 text-primary',
    ink: 'border-[rgba(15,23,42,0.08)] bg-white/95 text-foreground',
    green: 'border-emerald-100 bg-white/95 text-emerald-700',
  };

  return (
    <div
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-tight shadow-[0_10px_30px_-18px_rgba(15,23,42,0.5)] backdrop-blur-sm ${tones[tone]}`}>
      {label}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="w-[9.5rem] rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.55)] backdrop-blur-md">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-emerald-600">{hint}</p>
    </div>
  );
}
