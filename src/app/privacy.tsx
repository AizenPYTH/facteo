import { LegalExternalRedirect } from '@/components/legal/legal-external-redirect';
import { MARKETING_LEGAL_URLS } from '@/constants/marketing/site';

export default function PrivacyRedirect() {
  return (
    <LegalExternalRedirect label="Politique de confidentialité" url={MARKETING_LEGAL_URLS.privacy} />
  );
}
