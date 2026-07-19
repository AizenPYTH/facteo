import type { Metadata } from 'next';

import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import { PageHero } from '@/components/sections/landing-sections';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Le blog Factume — conseils facturation, gestion commerciale et actualités.',
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        subtitle="Conseils, guides et actualités pour les professionnels. Bientôt disponible."
        title="Blog Factume"
      />
      <section className="px-6 py-20 text-center lg:px-8">
        <FadeIn>
          <p className="mx-auto max-w-md text-muted">
            Nous préparons des articles sur la facturation, la gestion client et les bonnes pratiques
            pour artisans et indépendants.
          </p>
          <div className="mt-8">
            <Button href="/contact" variant="secondary">
              Être notifié du lancement
            </Button>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
