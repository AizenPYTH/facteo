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

import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/fade-in';
import { AnimatedBackground } from '@/components/marketing/animated-background';
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
