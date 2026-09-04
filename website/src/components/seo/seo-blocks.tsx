import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal';
import { breadcrumbSchema, faqSchema, jsonLd } from '@/lib/seo/schema';

/**
 * Briques partagées des pages de contenu.
 *
 * Les pages SEO répétaient sinon la même structure de titres, de fil d'Ariane
 * et de FAQ : un seul jeu de composants garantit une hiérarchie Hn cohérente
 * d'une page à l'autre, ce qui compte autant pour la lecture que pour
 * l'exploration.
 */

export function Breadcrumbs({ items }: { items: Array<{ name: string; path: string }> }) {
  return (
    <>
      <script dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(items))} type="application/ld+json" />
      <nav aria-label="Fil d’Ariane" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-muted">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li className="flex items-center gap-1" key={item.path}>
                {last ? (
                  <span aria-current="page" className="text-foreground/70">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link
                      className="focus-ring rounded transition-colors hover:text-primary"
                      href={item.path}>
                      {item.name}
                    </Link>
                    <ChevronRight aria-hidden className="text-border" size={13} />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/** Section de contenu avec un H2 et un corps rédigé. */
export function ContentSection({
  id,
  title,
  lead,
  children,
}: {
  id?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12" id={id}>
      <Reveal>
        <h2 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
          {title}
        </h2>
        {lead ? <p className="mt-4 text-[15.5px] leading-relaxed text-muted">{lead}</p> : null}
      </Reveal>
      {children ? <div className="mt-6 space-y-4">{children}</div> : null}
    </section>
  );
}

/** Paragraphe de corps de texte, à la mesure de lecture confortable. */
export function Prose({ children }: { children: ReactNode }) {
  return <p className="text-[15.5px] leading-[1.75] text-foreground/85">{children}</p>;
}

export function KeyPoints({ items }: { items: ReadonlyArray<string> }) {
  return (
    <RevealGroup as="ul" className="space-y-2.5">
      {items.map((item) => (
        <RevealItem as="li" className="flex items-start gap-3" key={item}>
          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span className="text-[15px] leading-relaxed text-foreground/85">{item}</span>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/**
 * Bloc de questions fréquentes.
 *
 * Le balisage FAQPage n'est émis que lorsque les questions sont rendues dans la
 * page — condition posée par Google, et seule façon que la donnée structurée
 * décrive ce que voit réellement le visiteur.
 */
export function FaqBlock({
  title = 'Questions fréquentes',
  items,
  emitSchema = true,
}: {
  title?: string;
  items: ReadonlyArray<{ question: string; answer: string }>;
  emitSchema?: boolean;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
      {emitSchema ? (
        <script dangerouslySetInnerHTML={jsonLd(faqSchema(items))} type="application/ld+json" />
      ) : null}

      <Reveal>
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
          {title}
        </h2>
      </Reveal>

      <RevealGroup className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {items.map((item) => (
          <RevealItem key={item.question}>
            <details className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 rounded text-[15px] font-medium text-foreground">
                {item.question}
                <ChevronRight
                  aria-hidden
                  className="mt-0.5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-90"
                  size={16}
                />
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{item.answer}</p>
            </details>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/** Liens vers les pages voisines — le maillage se construit à la lecture. */
export function RelatedLinks({
  title = 'À lire ensuite',
  links,
}: {
  title?: string;
  links: ReadonlyArray<{ label: string; description: string; href: string }>;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
      <Reveal>
        <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
      </Reveal>
      <RevealGroup className="mt-5 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <RevealItem key={link.href}>
            <Link
              className="focus-ring lift block h-full rounded-2xl border border-border bg-surface p-4"
              href={link.href}>
              <span className="block text-[14.5px] font-semibold text-foreground">{link.label}</span>
              <span className="mt-1.5 block text-[13px] leading-relaxed text-muted">
                {link.description}
              </span>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
