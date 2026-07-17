import { LegalExternalRedirect } from '@/components/legal/legal-external-redirect';
import { MARKETING_LEGAL_URLS } from '@/constants/marketing/site';

export default function TermsRedirect() {
  return (
    <LegalExternalRedirect label="Conditions d’utilisation" url={MARKETING_LEGAL_URLS.terms} />
  );
}
