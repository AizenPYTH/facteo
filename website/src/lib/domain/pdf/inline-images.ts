import type { PdfCompanyInfo } from '@/lib/pdf/engine';

async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result;

        if (typeof result !== 'string') {
          reject(new Error('Invalid image data.'));
          return;
        }

        resolve(result);
      };

      reader.onerror = () => reject(reader.error ?? new Error('Unable to read image.'));
      reader.readAsDataURL(blob);
    });

    return base64;
  } catch {
    return null;
  }
}

export async function inlinePdfClientSignature(
  signature: { url: string; signedAt: string } | null | undefined,
): Promise<{ url: string; signedAt: string } | null> {
  if (!signature?.url) {
    return null;
  }

  const inlinedUrl = await fetchAsDataUri(signature.url);

  return {
    url: inlinedUrl ?? signature.url,
    signedAt: signature.signedAt,
  };
}

export async function inlinePdfCompanyImages(company: PdfCompanyInfo): Promise<PdfCompanyInfo> {
  const [logoUrl, signatureUrl] = await Promise.all([
    company.logoUrl ? fetchAsDataUri(company.logoUrl) : Promise.resolve(null),
    company.signatureUrl ? fetchAsDataUri(company.signatureUrl) : Promise.resolve(null),
  ]);

  return {
    ...company,
    logoUrl: logoUrl ?? company.logoUrl,
    signatureUrl: signatureUrl ?? company.signatureUrl,
  };
}
