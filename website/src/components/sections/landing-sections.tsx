'use client';

import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/fade-in';
import {
  CTA,
  FAQ,
  MOBILE,
} from '@/lib/content';
import { APP_REGISTER_URL } from '@/lib/constants';

export { PricingSection } from '@/components/sections/pricing-section';


export function FaqSection({ compact = false }: { compact?: boolean }) {
  const items = compact ? FAQ.items.slice(0, 4) : FAQ.items;

  return (
    <Stagger className="mx-auto max-w-3xl space-y-4">
      {items.map((item) => (
        <StaggerItem key={item.question}>
          <details className="group rounded-2xl border border-border bg-surface">
            <summary className="cursor-pointer list-none px-6 py-5 font-medium text-foreground marker:content-none">
              {item.question}
            </summary>
            <p className="border-t border-border px-6 pb-5 pt-3 text-sm leading-relaxed text-muted">
              {item.answer}
            </p>
          </details>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function CtaSection() {
  return (
    <section className="px-5 py-[var(--section-y)] sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]">
      <FadeIn>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] bg-[#0B0E14] px-6 py-16 text-center text-white shadow-[0_40px_80px_-40px_rgba(49,46,129,0.6)] sm:px-10 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(139,92,246,0.4), transparent 65%), radial-gradient(ellipse 50% 60% at 85% 100%, rgba(37,99,235,0.28), transparent 60%)',
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
              {CTA.title}
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-slate-300">
              {CTA.subtitle}
            </p>
            <div className="mt-9 flex justify-center">
              <Button
                className="!bg-white !text-[#0B0E14] !shadow-[0_10px_30px_-10px_rgba(255,255,255,0.4)] hover:!bg-slate-100"
                href={APP_REGISTER_URL}
                size="lg">
                {CTA.cta}
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

export function MobileSection() {
  return (
    <section className="border-y border-border/60 bg-[#F7F4EF]/60 px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" id="download">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
        <FadeIn className="flex-1">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            {MOBILE.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{MOBILE.subtitle}</p>
          <ul className="mt-7 space-y-3">
            {MOBILE.highlights.map((h) => (
              <li className="flex items-center gap-2.5 text-[15px] text-foreground/90" key={h}>
                <Smartphone className="shrink-0 text-primary" size={18} /> {h}
              </li>
            ))}
          </ul>
          <FadeIn className="mt-9" delay={0.2}>
            <Button href="/telecharger" variant="secondary">
              Télécharger l’application
            </Button>
          </FadeIn>
        </FadeIn>
        <FadeIn className="flex flex-1 justify-center" delay={0.12}>
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.16),transparent_70%)] blur-xl"
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              className="relative h-[24rem] w-[11.5rem] overflow-hidden rounded-[2.45rem] border-[6px] border-[#0B1220] bg-[#F8FAFC] shadow-[0_32px_70px_-28px_rgba(15,23,42,0.55)]"
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
              <div className="mx-auto mt-2.5 h-5 w-[4.5rem] rounded-full bg-[#0B1220]" />
              <div className="mt-4 px-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-tight text-slate-800">Factures</p>
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700">
                    Live
                  </span>
                </div>
                <motion.div
                  animate={{ opacity: [0.85, 1, 0.85] }}
                  className="mt-3 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
                  <p className="text-[9px] font-medium text-slate-500">Martin SARL</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-900">1 435,20 €</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      animate={{ width: ['35%', '100%', '35%'] }}
                      className="h-full rounded-full bg-primary"
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
                <div className="mt-2 space-y-1.5">
                  {[
                    { name: 'Atelier Nord', amount: '890 €', status: 'Envoyée' },
                    { name: 'Lumen Studio', amount: '2 140 €', status: 'Payée' },
                  ].map((row) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-white/80 px-2 py-1.5 ring-1 ring-slate-100/80"
                      key={row.name}>
                      <div>
                        <p className="text-[9px] font-medium text-slate-800">{row.name}</p>
                        <p className="text-[8px] text-slate-400">{row.status}</p>
                      </div>
                      <p className="text-[9px] font-semibold text-slate-700">{row.amount}</p>
                    </div>
                  ))}
                </div>
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  className="mt-3 flex h-9 items-center justify-center rounded-xl bg-primary text-[10px] font-semibold text-white shadow-sm"
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
                  Nouvelle facture
                </motion.div>
              </div>
              <div className="absolute bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-300/90" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [0.9, 1, 0.9] }}
              className="absolute -right-6 top-16 hidden rounded-xl border border-white/80 bg-white/95 px-2.5 py-2 shadow-lg sm:block"
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <p className="text-[10px] font-semibold text-emerald-700">Paiement reçu</p>
              <p className="text-[9px] text-slate-500">+1 435,20 €</p>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border/60 px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid" />
      <FadeIn className="relative mx-auto max-w-3xl text-center">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-4 text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-foreground sm:text-[2.75rem] lg:text-[3rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-[1.0625rem]">
            {subtitle}
          </p>
        ) : null}
      </FadeIn>
    </section>
  );
}
