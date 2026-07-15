import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

import { FadeIn } from '@/components/ui/fade-in';
import type { LegalSection } from '@/lib/legal-content';
import { LEGAL_CONTACT } from '@/lib/legal-content';

type LegalPageProps = {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: LegalSection[];
  relatedLinks?: ReadonlyArray<{ label: string; href: string }>;
};

export function LegalPage({
  title,
  subtitle,
  lastUpdated,
  sections,
  relatedLinks,
}: LegalPageProps) {
  const defaultRelated = [
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: 'Conditions d’utilisation', href: '/conditions-utilisation' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Mentions légales', href: '/mentions-legales' },
  ];

  const links = relatedLinks ?? defaultRelated;

  return (
    <div className="marketing-gradient border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Légal</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-4 max-w-3xl text-lg text-muted">{subtitle}</p> : null}
          <p className="mt-6 inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-sm text-muted">
            Dernière mise à jour : {lastUpdated}
          </p>
        </FadeIn>
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 lg:grid-cols-[260px_1fr] lg:px-8">
        <FadeIn className="lg:sticky lg:top-24 lg:self-start" delay={0.05}>
          <nav className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Sommaire</p>
            <ul className="mt-4 space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    className="block text-sm text-slate-600 transition hover:text-primary"
                    href={`#${section.id}`}>
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Voir aussi</p>
              <ul className="mt-2 space-y-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link className="text-sm text-primary hover:underline" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </FadeIn>

        <div className="legal-prose space-y-10">
          {sections.map((section, index) => (
            <FadeIn delay={index * 0.03} key={section.id}>
              <section className="scroll-mt-28 rounded-2xl border border-border bg-surface p-8 shadow-sm" id={section.id}>
                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                <div className="mt-5 space-y-4">
                  {section.paragraphs.map((p) => (
                    <p className="text-base leading-relaxed text-muted" key={p.slice(0, 48)}>
                      {p}
                    </p>
                  ))}
                </div>
                {section.links?.map((link) => (
                  <Link
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    href={link.href}
                    key={link.href}>
                    {link.label} →
                  </Link>
                ))}
              </section>
            </FadeIn>
          ))}

          <div className="rounded-2xl border border-primary/20 bg-blue-50/50 p-8">
            <h3 className="text-lg font-bold text-foreground">Contact & RGPD</h3>
            <p className="mt-2 text-sm text-muted">
              Pour toute question relative à vos données personnelles ou à ces documents légaux :
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Société</dt>
                <dd className="font-medium text-foreground">{LEGAL_CONTACT.company}</dd>
              </div>
              <div>
                <dt className="text-muted">Site</dt>
                <dd className="font-medium text-foreground">{LEGAL_CONTACT.website}</dd>
              </div>
              <div>
                <dt className="text-muted">E-mail</dt>
                <dd>
                  <a className="font-medium text-primary" href={`mailto:${LEGAL_CONTACT.email}`}>
                    {LEGAL_CONTACT.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-muted">DPO</dt>
                <dd>
                  <a className="font-medium text-primary" href={`mailto:${LEGAL_CONTACT.dpo}`}>
                    {LEGAL_CONTACT.dpo}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <a
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            href="#">
            <ArrowUp size={16} />
            Retour en haut
          </a>
        </div>
      </div>
    </div>
  );
}
