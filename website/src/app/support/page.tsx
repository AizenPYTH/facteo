import type { Metadata } from 'next';

import { FadeIn } from '@/components/ui/fade-in';
import { PageHero } from '@/components/sections/landing-sections';
import { SUPPORT_EMAIL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Centre d’aide et support technique FACTEO.',
};

export default function SupportPage() {
  return (
    <>
      <PageHero
        subtitle="Notre équipe vous accompagne dans l’utilisation de FACTEO."
        title="Support"
      />
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <FadeIn>
            <div className="card-hover rounded-2xl border border-border bg-surface p-8">
              <h2 className="text-lg font-semibold text-foreground">Documentation</h2>
              <p className="mt-2 text-sm text-muted">
                Guides, tutoriels et bonnes pratiques pour maîtriser FACTEO.
              </p>
              <p className="mt-4 text-sm text-muted">Bientôt disponible.</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="card-hover rounded-2xl border border-border bg-surface p-8">
              <h2 className="text-lg font-semibold text-foreground">Assistance technique</h2>
              <p className="mt-2 text-sm text-muted">Bugs, questions d’utilisation, suggestions produit.</p>
              <a className="mt-4 block font-medium text-primary" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
