'use client';

import { ArrowRight, Building2, CheckCircle2, RefreshCw, Send, ShieldCheck } from 'lucide-react';

import { AnimatedBackground } from '@/components/marketing/animated-background';
import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/fade-in';
import { APP_REGISTER_URL } from '@/lib/constants';
import {
  E_INVOICING_CHAIN,
  E_INVOICING_CHANGES,
  E_INVOICING_CONNECTION,
  E_INVOICING_FAQ,
  E_INVOICING_HERO,
  E_INVOICING_INTRO,
  E_INVOICING_INVEQ,
  E_INVOICING_SUPERPDP,
} from '@/lib/e-invoicing-content';

export function EInvoicingHero() {
  return (
    <section className="gradient-hero relative overflow-hidden border-b border-border px-6 py-16 lg:px-8 lg:py-20">
      <AnimatedBackground />
      <FadeIn className="relative mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          {E_INVOICING_HERO.overline}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
          {E_INVOICING_HERO.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{E_INVOICING_HERO.subtitle}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href={APP_REGISTER_URL}>{E_INVOICING_HERO.ctaPrimary}</Button>
          <Button href="#comment-ca-marche" variant="secondary">
            {E_INVOICING_HERO.ctaSecondary}
          </Button>
        </div>
      </FadeIn>
    </section>
  );
}

export function EInvoicingIntroSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            {E_INVOICING_INTRO.title}
          </h2>
          {E_INVOICING_INTRO.paragraphs.map((paragraph) => (
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </FadeIn>
        <Stagger className="mt-12 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {E_INVOICING_INTRO.bullets.map((bullet) => (
            <StaggerItem key={bullet}>
              <div className="card-hover flex h-full items-start gap-3.5 rounded-2xl border border-border/80 bg-surface p-5 sm:p-6">
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

export function EInvoicingChangesSection() {
  return (
    <section className="border-y border-border/60 px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            {E_INVOICING_CHANGES.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            {E_INVOICING_CHANGES.subtitle}
          </p>
        </FadeIn>
        <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
          {E_INVOICING_CHANGES.columns.map((column) => (
            <StaggerItem key={column.title}>
              <div className="card-hover h-full rounded-2xl border border-border bg-surface p-6 sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                  {column.tone === 'stable' ? <CheckCircle2 size={22} /> : <RefreshCw size={22} />}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{column.title}</h3>
                <ul className="mt-5 space-y-3">
                  {column.items.map((item) => (
                    <li className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground/90" key={item}>
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function EInvoicingChainSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            {E_INVOICING_CHAIN.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            {E_INVOICING_CHAIN.subtitle}
          </p>
        </FadeIn>
        <Stagger className="mt-12 grid gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))]">
          {E_INVOICING_CHAIN.steps.map((step, index) => (
            <StaggerItem key={step.name}>
              <div className="relative flex h-full flex-col rounded-2xl border border-border bg-surface p-6 card-hover">
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">{step.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
                {index < E_INVOICING_CHAIN.steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="mt-5 flex items-center justify-center text-primary lg:absolute lg:right-[-1.4rem] lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
                    <ArrowRight className="rotate-90 lg:rotate-0" size={20} />
                  </span>
                ) : null}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <FadeIn className="mt-8">
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-muted">
            {E_INVOICING_CHAIN.note}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

export function EInvoicingPlatformSection() {
  return (
    <section className="border-y border-border/60 px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="max-w-3xl">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <ShieldCheck size={22} />
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            {E_INVOICING_SUPERPDP.title}
          </h2>
          {E_INVOICING_SUPERPDP.paragraphs.map((paragraph) => (
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </FadeIn>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {E_INVOICING_SUPERPDP.facts.map((fact) => (
            <StaggerItem key={fact.title}>
              <div className="card-hover h-full rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-semibold tracking-tight text-foreground">{fact.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{fact.description}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <FadeIn className="mt-8">
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-muted">
            {E_INVOICING_SUPERPDP.disclaimer}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

export function EInvoicingConnectionSection() {
  return (
    <section className="px-6 py-20 lg:px-8" id="comment-ca-marche">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            {E_INVOICING_CONNECTION.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            {E_INVOICING_CONNECTION.subtitle}
          </p>
        </FadeIn>
        <Stagger className="mt-12 space-y-4">
          {E_INVOICING_CONNECTION.steps.map((step, index) => (
            <StaggerItem key={step.title}>
              <div className="card-hover flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:gap-6 sm:p-8">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold tabular-nums text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.description}</p>
                  {step.where ? (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted">
                      <Building2 aria-hidden size={14} /> {step.where}
                    </p>
                  ) : null}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <FadeIn className="mt-8">
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Send aria-hidden className="text-primary" size={18} />
              {E_INVOICING_INVEQ.title}
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {E_INVOICING_INVEQ.items.map((item) => (
                <li className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground/90" key={item}>
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-muted">{E_INVOICING_INVEQ.disclaimer}</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function EInvoicingFaqSection() {
  return (
    <section className="border-t border-border/60 px-6 py-20 lg:px-8">
      <FadeIn className="mx-auto mb-10 max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
          {E_INVOICING_FAQ.title}
        </h2>
      </FadeIn>
      <Stagger className="mx-auto max-w-3xl space-y-4">
        {E_INVOICING_FAQ.items.map((item) => (
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
    </section>
  );
}