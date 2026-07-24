import type { Metadata } from 'next';

import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { CompanyProvider } from '@/providers/company-provider';

export const metadata: Metadata = {
  title: 'Configurer votre entreprise',
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <CompanyProvider>
      <OnboardingWizard />
    </CompanyProvider>
  );
}
