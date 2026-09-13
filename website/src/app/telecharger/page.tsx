import type { Metadata } from 'next';
import { Monitor, Smartphone } from 'lucide-react';

import { AppStoreQrSection } from '@/components/sections/app-store-qr';
import { PageHero } from '@/components/sections/landing-sections';
import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/fade-in';
import { DOWNLOAD } from '@/lib/content';
import { SITE_URL, APP_DASHBOARD_URL } from '@/lib/constants';

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/telecharger` },
  title: 'Télécharger l’application',
  description:
    'Téléchargez INVEQ sur iOS, Android ou accédez à l’application web depuis votre navigateur.',
};

export default function DownloadPage() {
  return (
    <>
      <PageHero subtitle={DOWNLOAD.subtitle} title={DOWNLOAD.title} />
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Stagger className="grid gap-8 md:grid-cols-3">
            {DOWNLOAD.platforms.map((platform) => (
              <StaggerItem key={platform.id}>
                <div className="card-hover flex h-full flex-col rounded-2xl border border-border bg-surface p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
                    {platform.id === 'web' ? <Monitor size={24} /> : <Smartphone size={24} />}
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-foreground">{platform.name}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{platform.description}</p>
                  <div className="mt-6">
                    {platform.available ? (
                      <Button
                        external={platform.href.startsWith('http')}
                        href={platform.href}
                        variant={platform.id === 'web' ? 'primary' : 'secondary'}>
                        {platform.cta}
                      </Button>
                    ) : (
                      <span className="inline-flex rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted">
                        {platform.cta}
                      </span>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <AppStoreQrSection />

          <FadeIn className="mt-16 rounded-2xl border border-border bg-slate-50 p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">Déjà un compte ?</h3>
            <p className="mt-2 text-sm text-muted">
              Connectez-vous directement depuis votre navigateur sur l’application web.
            </p>
            <div className="mt-6">
              <Button href={APP_DASHBOARD_URL}>
                Ouvrir l’application web
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
