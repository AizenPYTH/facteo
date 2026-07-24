import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';
import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description: 'CGU INVEQ — abonnement, responsabilités, paiement et droits des utilisateurs.',
};

export default function TermsPage() {
  return (
    <LegalPage
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={TERMS_SECTIONS}
      subtitle="Conditions régissant l’utilisation de l’application et du site INVEQ."
      title="Conditions générales d’utilisation"
    />
  );
}
