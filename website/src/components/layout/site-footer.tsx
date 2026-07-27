import Link from 'next/link';

import { BrandWordmark } from '@/components/brand/brand-logo';
import { FOOTER } from '@/lib/content';
import { SITE_NAME } from '@/lib/constants';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-[#0B0E14] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <BrandWordmark className="rounded-lg bg-white px-2.5 py-1.5" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            La facturation moderne pour artisans, freelances et PME.
          </p>
        </div>

        <FooterColumn links={FOOTER.product} title="Produit" />
        <FooterColumn links={FOOTER.company} title="Entreprise" />
        <FooterColumn links={FOOTER.legal} title="Légal" />
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-slate-500 sm:flex-row lg:px-8">
          <p>© {year} {SITE_NAME}. Tous droits réservés.</p>
          <p>Fait en France · INVEQ</p>
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
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.href.startsWith('mailto:') ? (
              <a className="text-sm text-slate-400 transition-colors hover:text-white" href={link.href}>
                {link.label}
              </a>
            ) : (
              <Link className="text-sm text-slate-400 transition-colors hover:text-white" href={link.href}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
