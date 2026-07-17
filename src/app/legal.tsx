import { LegalExternalRedirect } from '@/components/legal/legal-external-redirect';
import { MARKETING_LEGAL_URLS } from '@/constants/marketing/site';

export default function LegalRedirect() {
  return <LegalExternalRedirect label="Mentions légales" url={MARKETING_LEGAL_URLS.legal} />;
}
