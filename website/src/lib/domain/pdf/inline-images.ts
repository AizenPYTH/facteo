import type { PdfCompanyInfo } from '@/lib/pdf/engine';
import { inlineImage, inlineLogo } from '@/lib/domain/company-assets/logo-image';

/**
 * Les images du document (logo, signatures) sont embarquées en data-URI avant
 * le rendu. Le bucket des logos étant privé, elles sont lues avec la session
 * de l'utilisateur. Une image introuvable est retirée (null) : jamais d'image
 * cassée sur une facture.
 */

const logoCache = new Map<string, Promise<{ dataUri: string; ratio: number | null } | null>>();
const imageCache = new Map<string, Promise<string | null>>();

function cachedLogo(url: string) {
  let pending = logoCache.get(url);
  if (!pending) {
    pending = inlineLogo(url).catch(() => null);
    logoCache.set(url, pending);
    // Un échec (réseau, session) n'est pas mémorisé : on réessaiera au prochain rendu.
    void pending.then((result) => {
      if (!result) logoCache.delete(url);
    });
  }
  return pending;
}

function cachedImage(url: string) {
  let pending = imageCache.get(url);
  if (!pending) {
    pending = inlineImage(url).catch(() => null);
    imageCache.set(url, pending);
    void pending.then((result) => {
      if (!result) imageCache.delete(url);
    });
  }
  return pending;
}

export async function inlinePdfClientSignature(
  signature: { url: string; signedAt: string } | null | undefined,
): Promise<{ url: string; signedAt: string } | null> {
  if (!signature?.url) {
    return null;
  }

  const inlinedUrl = signature.url.startsWith('data:') ? signature.url : await cachedImage(signature.url);

  return inlinedUrl ? { url: inlinedUrl, signedAt: signature.signedAt } : null;
}

export async function inlinePdfCompanyImages(company: PdfCompanyInfo): Promise<PdfCompanyInfo> {
  const [logo, signatureUrl] = await Promise.all([
    company.logoUrl ? cachedLogo(company.logoUrl) : Promise.resolve(null),
    company.signatureUrl
      ? company.signatureUrl.startsWith('data:')
        ? Promise.resolve(company.signatureUrl)
        : cachedImage(company.signatureUrl)
      : Promise.resolve(null),
  ]);

  return {
    ...company,
    logoUrl: logo?.dataUri ?? null,
    logoRatio: logo?.ratio ?? null,
    signatureUrl,
  };
}
