import Link from 'next/link';

import { BrandWordmark } from '@/components/brand/brand-logo';
import { CONTACT_EMAIL, IOS_APP_STORE_URL, SITE_NAME } from '@/lib/constants';
import { FOOTER } from '@/lib/content';

/**
 * Pied de page.
 *
 * Ne contient que des liens qui existent réellement dans l'application — les
 * colonnes sont construites à partir de `FOOTER`, lui-même aligné sur les
 * routes du projet.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-[#0B0E14] text-slate-300">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
          <div>
            <BrandWordmark className="rounded-lg bg-white px-2.5 py-1.5" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
              Devis, factures et facturation électronique pour les artisans, les indépendants et
              les TPE.
            </p>
            <a
              className="focus-ring mt-5 inline-block rounded text-sm text-slate-400 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-white"
              href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            <div className="mt-6">
              <a
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-[12.5px] font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
                href={IOS_APP_STORE_URL}
                rel="noopener noreferrer"
                target="_blank">
                Télécharger sur l’App Store
              </a>
            </div>
          </div>

          <FooterColumn links={FOOTER.product} title="Produit" />
          <FooterColumn links={FOOTER.company} title="Entreprise" />
          <FooterColumn links={FOOTER.legal} title="Légal" />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-slate-500 sm:flex-row sm:items-center">
          <p>
            © {year} {SITE_NAME}. Tous droits réservés.
          </p>
          <p>Conçu et développé en France</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h3>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.href.startsWith('mailto:') ? (
              <a
                className="focus-ring rounded text-sm text-slate-400 transition-colors hover:text-white"
                href={link.href}>
                {link.label}
              </a>
            ) : (
              <Link
                className="focus-ring rounded text-sm text-slate-400 transition-colors hover:text-white"
                href={link.href}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
