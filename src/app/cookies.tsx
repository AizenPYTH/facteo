import { LegalExternalRedirect } from '@/components/legal/legal-external-redirect';
import { MARKETING_LEGAL_URLS } from '@/constants/marketing/site';

export default function CookiesRedirect() {
  return (
    <LegalExternalRedirect label="Politique des cookies" url={MARKETING_LEGAL_URLS.cookies} />
  );
}
