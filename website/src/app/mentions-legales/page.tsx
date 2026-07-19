import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';
import { LEGAL_LAST_UPDATED, LEGAL_MENTIONS_SECTIONS } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales Factume — éditeur, hébergement et propriété intellectuelle.',
};

export default function LegalMentionsPage() {
  return (
    <LegalPage
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={LEGAL_MENTIONS_SECTIONS}
      subtitle="Informations légales relatives à l’éditeur et à l’hébergement."
      title="Mentions légales"
    />
  );
}
