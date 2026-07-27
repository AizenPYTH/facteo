import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import { PageHero } from '@/components/sections/landing-sections';
import {
  CONTACT_EMAIL,
  SUPPORT_EMAIL,
  hasPublicContactEmail,
  hasPublicSupportEmail,
} from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l’équipe INVEQ pour toute question commerciale ou support technique.',
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        subtitle="Notre équipe vous répond sous 24 à 48 heures ouvrées."
        title="Contactez-nous"
      />
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <FadeIn>
            <div className="card-hover rounded-2xl border border-border bg-surface p-8">
              <h2 className="text-lg font-semibold text-foreground">Commercial</h2>
              <p className="mt-2 text-sm text-muted">
                Questions sur les offres, démonstrations, partenariats.
              </p>
              {hasPublicContactEmail ? (
                <a className="mt-4 block font-medium text-primary" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  Utilisez le formulaire de contact dès qu’il sera disponible, ou la page{' '}
                  <Link className="font-medium text-primary hover:underline" href="/support">
                    Support
                  </Link>
                  .
                </p>
              )}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="card-hover rounded-2xl border border-border bg-surface p-8">
              <h2 className="text-lg font-semibold text-foreground">Support technique</h2>
              <p className="mt-2 text-sm text-muted">Aide à l’utilisation, bugs, suggestions produit.</p>
              {hasPublicSupportEmail ? (
                <a className="mt-4 block font-medium text-primary" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
              ) : (
                <Link className="mt-4 inline-block font-medium text-primary hover:underline" href="/support">
                  Consulter le centre d’aide
                </Link>
              )}
            </div>
          </FadeIn>
        </div>
        <FadeIn className="mt-12 text-center">
          {hasPublicContactEmail ? (
            <Button href={`mailto:${CONTACT_EMAIL}`} external variant="primary">
              Envoyer un e-mail
            </Button>
          ) : (
            <Button href="/support" variant="primary">
              Aller au support
            </Button>
          )}
        </FadeIn>
      </section>
    </>
  );
}
