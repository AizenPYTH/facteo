import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';
import { COOKIES_SECTIONS, LEGAL_LAST_UPDATED } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Politique des cookies',
  description: 'Politique des cookies FACTEO — types, utilité et gestion du consentement.',
};

export default function CookiesPage() {
  return (
    <LegalPage
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={COOKIES_SECTIONS}
      subtitle="Informations sur les cookies et traceurs utilisés par FACTEO."
      title="Politique des cookies"
    />
  );
}
