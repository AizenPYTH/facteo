import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { PDF_LAYOUT } from '@/lib/pdf/engine/layout';

type RenderFrame = {
  iframe: HTMLIFrameElement;
  page: HTMLElement;
};

async function waitForLayout(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  );
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function measurePageHeight(page: HTMLElement): number {
  return Math.max(
    page.scrollHeight,
    page.offsetHeight,
    page.getBoundingClientRect().height,
    PDF_LAYOUT.renderHeightPx,
  );
}

async function createRenderFrame(html: string): Promise<RenderFrame> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_LAYOUT.renderWidthPx}px;border:0;visibility:hidden;`;
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Impossible de préparer le rendu PDF.');
  }

  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve) => {
    const done = () => resolve();
    iframe.onload = done;
    setTimeout(done, 800);
  });

  await waitForLayout(doc);

  const page =
    doc.querySelector<HTMLElement>('.page') ?? doc.body;

  iframe.style.height = `${measurePageHeight(page)}px`;

  await waitForLayout(doc);

  return { iframe, page };
}

function destroyRenderFrame(frame: RenderFrame): void {
  if (frame.iframe.parentNode) {
    frame.iframe.parentNode.removeChild(frame.iframe);
  }
}

export async function htmlStringToPdfBlob(html: string): Promise<Blob> {
  const frame = await createRenderFrame(html);

  try {
    const pageHeight = measurePageHeight(frame.page);
    frame.iframe.style.height = `${pageHeight}px`;
    await waitForLayout(frame.iframe.contentDocument!);

    const canvas = await html2canvas(frame.page, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: PDF_LAYOUT.renderWidthPx,
      windowWidth: PDF_LAYOUT.renderWidthPx,
      height: pageHeight,
      windowHeight: pageHeight,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidthMm = PDF_LAYOUT.pageWidthMm;
    const pageHeightMm = PDF_LAYOUT.pageHeightMm;

    const imgWidth = pageWidthMm;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    let position = 0;
    let remaining = imgHeight;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    remaining -= pageHeightMm;

    while (remaining > 0) {
      position -= pageHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      remaining -= pageHeightMm;
    }

    return pdf.output('blob');
  } finally {
    destroyRenderFrame(frame);
  }
}

export async function downloadPdfFromHtml(html: string, filename: string): Promise<void> {
  const blob = await htmlStringToPdfBlob(html);
  const safeName = filename.replace(/\.(html|pdf)$/i, '');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function printPdfFromHtml(html: string): Promise<void> {
  const blob = await htmlStringToPdfBlob(html);
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');

  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error('Autorisez les pop-ups pour imprimer le PDF.');
  }

  printWindow.addEventListener('load', () => {
    printWindow.focus();
    printWindow.print();
  });

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function sharePdfFromHtml(
  html: string,
  filename: string,
  title: string,
): Promise<boolean> {
  const blob = await htmlStringToPdfBlob(html);
  const safeName = filename.replace(/\.(html|pdf)$/i, '');
  const file = new File([blob], `${safeName}.pdf`, { type: 'application/pdf' });

  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return true;
  }

  await downloadPdfFromHtml(html, safeName);
  return false;
}

export function openPdfPreviewBlob(html: string): Promise<void> {
  return htmlStringToPdfBlob(html).then((blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  });
}
