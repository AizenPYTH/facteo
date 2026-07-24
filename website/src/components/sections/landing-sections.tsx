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
import { CountUp } from '@/components/marketing/count-up';
import InvoiceHero from '@/components/hero/InvoiceHero';
import {
  CTA,
  FAQ,
  FEATURES,
  HERO,
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
    <section className="gradient-hero relative overflow-hidden px-6 pb-24 pt-20 lg:px-8 lg:pt-28">
      <AnimatedBackground />
      <div className="relative mx-auto max-w-6xl">
        <InvoiceHero />
      </div>
    </section>
  );
}

export function PresentationSection() {
  return (
    <section className="px-6 py-20 lg:px-8" id="presentation">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">{PRESENTATION.title}</h2>
          <p className="mt-4 text-lg text-muted">{PRESENTATION.subtitle}</p>
        </FadeIn>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2">
          {PRESENTATION.bullets.map((bullet) => (
            <StaggerItem key={bullet}>
              <div className="card-hover flex items-start gap-3 rounded-2xl border border-border bg-surface p-6">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p className="text-foreground">{bullet}</p>
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
    <section className="bg-slate-50 px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <FadeIn>
          <h2 className="text-3xl font-bold text-foreground">{WHY.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">{WHY.subtitle}</p>
        </FadeIn>
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.items.map((item) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <StaggerItem key={item.title}>
                <div className="card-hover rounded-2xl border border-border bg-surface p-6 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
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
    <section className="px-6 py-20 lg:px-8">
      <FadeIn>
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-primary to-primary-dark px-8 py-16 text-center text-white shadow-2xl shadow-primary/30">
          <h2 className="text-3xl font-bold">{CTA.title}</h2>
          <p className="mx-auto mt-4 max-w-lg text-blue-100">{CTA.subtitle}</p>
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
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold text-foreground">{TESTIMONIALS.title}</h2>
          <p className="mt-4 text-muted">{TESTIMONIALS.subtitle}</p>
        </FadeIn>
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.items.map((t) => (
            <StaggerItem key={t.author}>
              <blockquote className="card-hover h-full rounded-2xl border border-border bg-surface p-6">
                <p className="text-foreground">“{t.quote}”</p>
                <footer className="mt-4 text-sm text-muted">
                  <strong className="text-foreground">{t.author}</strong> — {t.role}
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
    <section className="bg-slate-50 px-6 py-20 lg:px-8" id="download">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row">
        <FadeIn className="flex-1">
          <h2 className="text-3xl font-bold text-foreground">{MOBILE.title}</h2>
          <p className="mt-4 text-lg text-muted">{MOBILE.subtitle}</p>
          <ul className="mt-6 space-y-3">
            {MOBILE.highlights.map((h) => (
              <li className="flex items-center gap-2 text-foreground" key={h}>
                <Smartphone className="text-primary" size={18} /> {h}
              </li>
            ))}
          </ul>
          <FadeIn className="mt-8" delay={0.25}>
            <Button href="/telecharger" variant="secondary">
              Télécharger l’application
            </Button>
          </FadeIn>
        </FadeIn>
        <FadeIn className="flex-1" delay={0.15}>
          <div className="mx-auto h-80 w-48 rounded-[2.5rem] border-8 border-slate-800 bg-surface shadow-2xl" />
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
