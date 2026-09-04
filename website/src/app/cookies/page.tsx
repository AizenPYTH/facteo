import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';
import { COOKIES_SECTIONS, LEGAL_LAST_UPDATED } from '@/lib/legal-content';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/cookies` },
  title: 'Politique des cookies',
  description: 'Politique des cookies INVEQ — types, utilité et gestion du consentement.',
};

export default function CookiesPage() {
  return (
    <LegalPage
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={COOKIES_SECTIONS}
      subtitle="Informations sur les cookies et traceurs utilisés par INVEQ."
      title="Politique des cookies"
    />
  );
}
