import {
  downloadPdfFromHtml,
  openPdfPreviewBlob,
  printPdfFromHtml,
  sharePdfFromHtml,
} from '@/lib/domain/pdf/pdf-export';

/** @deprecated Utiliser downloadPdfFromHtml */
export async function downloadPdfHtml(html: string, filename: string): Promise<void> {
  await downloadPdfFromHtml(html, filename);
}

export async function printPdfHtml(html: string, _title: string): Promise<void> {
  await printPdfFromHtml(html);
}

export async function sharePdfHtml(
  html: string,
  filename: string,
  title: string,
): Promise<boolean> {
  return sharePdfFromHtml(html, filename, title);
}

export async function previewPdfHtml(html: string): Promise<void> {
  await openPdfPreviewBlob(html);
}

export function openMailto(recipient: string | null, subject: string, body: string): void {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const to = recipient?.trim() || '';
  const qs = params.toString();
  window.location.href = `mailto:${encodeURIComponent(to)}${qs ? `?${qs}` : ''}`;
}

export {
  downloadPdfFromHtml,
  printPdfFromHtml,
  sharePdfFromHtml,
  openPdfPreviewBlob,
} from '@/lib/domain/pdf/pdf-export';
