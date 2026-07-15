import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité FACTEO — protection des données, RGPD et sécurité.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={PRIVACY_SECTIONS}
      subtitle="Comment nous collectons, utilisons et protégeons vos données personnelles."
      title="Politique de confidentialité"
    />
  );
}
