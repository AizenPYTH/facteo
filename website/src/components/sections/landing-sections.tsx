'use client';

import type { ElementType } from 'react';
import {
  Building2,
  Cloud,
  CreditCard,
  FileText,
  Monitor,
  PenLine,
  Receipt,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/fade-in';
import { AnimatedBackground } from '@/components/marketing/animated-background';
import InvoiceHero from '@/components/hero/InvoiceHero';
import {
  CTA,
  FAQ,
  FEATURES,
  MOBILE,
  PRESENTATION,
  TESTIMONIALS,
  WHY,
} from '@/lib/content';
import { APP_REGISTER_URL } from '@/lib/constants';

export { PricingSection } from '@/components/sections/pricing-section';

const ICONS: Record<string, ElementType> = {
  sparkles: Sparkles,
  shield: Shield,
  smartphone: Smartphone,
  cloud: Cloud,
  users: Users,
  'file-text': FileText,
  receipt: Receipt,
  file: FileText,
  'pen-line': PenLine,
  'credit-card': CreditCard,
  'bar-chart': BarChart3,
  'building-2': Building2,
  monitor: Monitor,
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
      <AnimatedBackground />
      <div className="relative">
        <InvoiceHero />
      </div>
    </section>
  );
}

export function PresentationSection() {
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" id="presentation">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {PRESENTATION.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{PRESENTATION.subtitle}</p>
        </FadeIn>
        <Stagger className="mt-12 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4">
          {PRESENTATION.bullets.map((bullet) => (
            <StaggerItem key={bullet}>
              <div className="card-hover flex items-start gap-3.5 rounded-2xl border border-border/80 bg-surface p-5 sm:p-6">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <p className="text-[15px] leading-relaxed text-foreground/90">{bullet}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function WhySection() {
  return (
    <section className="border-y border-border/60 bg-[#F7F4EF]/70 px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl text-center">
        <FadeIn>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            {WHY.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">{WHY.subtitle}</p>
        </FadeIn>
        <Stagger className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.items.map((item) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <StaggerItem key={item.title}>
                <div className="card-hover h-full rounded-2xl border border-border/80 bg-surface p-6 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 font-semibold tracking-tight text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

export function FeaturesGrid({ showAll = false }: { showAll?: boolean }) {
  const items = showAll ? FEATURES.items : FEATURES.items.slice(0, 6);

  return (
    <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? FileText;
        return (
          <StaggerItem key={item.title}>
            <div className="card-hover group h-full rounded-2xl border border-border bg-surface p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

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
    <section className="px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <FadeIn>
        <div className="mx-auto max-w-4xl rounded-[1.75rem] bg-gradient-to-br from-[#1D4ED8] to-[#0B1220] px-6 py-14 text-center text-white shadow-[0_24px_60px_-24px_rgba(29,78,216,0.55)] sm:px-10 sm:py-16">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{CTA.title}</h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-blue-100/90">{CTA.subtitle}</p>
          <div className="mt-8">
            <Button className="!bg-white !text-primary !shadow-none hover:!bg-blue-50" href={APP_REGISTER_URL}>
              {CTA.cta}
            </Button>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            {TESTIMONIALS.title}
          </h2>
          <p className="mt-4 text-muted">{TESTIMONIALS.subtitle}</p>
        </FadeIn>
        <Stagger className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3 md:gap-5">
          {TESTIMONIALS.items.map((t) => (
            <StaggerItem key={t.author}>
              <blockquote className="card-hover h-full rounded-2xl border border-border/80 bg-surface p-6">
                <p className="text-[15px] leading-relaxed text-foreground/90">“{t.quote}”</p>
                <footer className="mt-5 text-sm text-muted">
                  <strong className="font-semibold text-foreground">{t.author}</strong> — {t.role}
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
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

export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="gradient-hero relative overflow-hidden border-b border-border px-6 py-16 lg:px-8 lg:py-20">
      <AnimatedBackground />
      <FadeIn className="relative mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-4 text-lg text-muted">{subtitle}</p> : null}
      </FadeIn>
    </section>
  );
}
