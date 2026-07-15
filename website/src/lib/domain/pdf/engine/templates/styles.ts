import { getPdfLayoutStyles } from '@/lib/pdf/engine/layout';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

export function getTemplatePdfStyles(template: PdfTemplateDefinition): string {
  const { theme: colors, tableStyle, totalsStyle, headerStyle, layout } = template;

  const tableExtra =
    tableStyle === 'striped'
      ? `tbody tr:nth-child(even) td { background: ${colors.surface}; }`
      : tableStyle === 'bordered'
        ? `th, td { border: 1px solid ${colors.border}; }`
        : tableStyle === 'minimal'
          ? `th { border-bottom: 2px solid ${colors.primary}; background: transparent; }
             td { border-bottom: 1px solid ${colors.border}; }`
          : '';

  const totalsExtra =
    totalsStyle === 'highlight'
      ? `.totals { background: ${colors.paymentBg}; border: 1px solid ${colors.paymentBorder}; border-radius: 12px; padding: 14px; }`
      : totalsStyle === 'boxed'
        ? `.totals { border: 2px solid ${colors.border}; border-radius: 10px; padding: 14px; }`
        : totalsStyle === 'accent'
          ? `.totals-row.total { background: ${colors.primary}; color: #fff; padding: 10px 12px; border-radius: 8px; margin-top: 8px; border-top: none; }`
          : '';

  const headerBand =
    headerStyle === 'band' || layout === 'banner' || layout === 'stripe'
      ? `.header-band { background: ${colors.primary}; color: #fff; padding: 22px 24px; border-radius: ${layout === 'stripe' ? '8px' : '12px'}; margin-bottom: 28px; }
         .header-band .doc-title, .header-band .meta, .header-band .meta div { color: #fff; }
         .header-band .logo { filter: brightness(0) invert(1); }`
      : headerStyle === 'boxed'
        ? `.header { border: 2px solid ${colors.border}; border-radius: 12px; padding: 18px; }`
        : headerStyle === 'underline'
          ? `.doc-title { border-bottom: 3px solid ${colors.primary}; padding-bottom: 10px; }`
          : '';

  return `
    ${getPdfLayoutStyles()}
    html, body {
      font-family: ${template.fontFamily};
      color: ${colors.text};
      font-size: 10.5px;
      line-height: 1.55;
      background: ${colors.surfaceAlt};
    }
    .header { display: flex; justify-content: space-between; gap: 28px; margin-bottom: 28px; page-break-inside: avoid; }
    .header-center { flex-direction: column; align-items: center; text-align: center; }
    .header-split .meta { text-align: left; }
    .logo { max-height: 68px; max-width: 200px; object-fit: contain; margin-bottom: 12px; image-rendering: -webkit-optimize-contrast; }
    .logo-center { margin-left: auto; margin-right: auto; }
    .logo-right { margin-left: auto; display: block; }
    .doc-title { font-size: 24px; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 10px; color: ${colors.primary}; }
    .meta { text-align: ${template.titleAlign}; }
    .meta div { margin-bottom: 4px; }
    .company-name, .client-name { font-size: 13px; font-weight: 600; margin-bottom: 5px; }
    .muted { color: ${colors.muted}; }
    .parties { display: flex; gap: 20px; margin-bottom: 26px; page-break-inside: avoid; }
    .party { flex: 1; background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 16px; }
    .party h3 { margin: 0 0 10px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: ${colors.muted}; font-weight: 600; }
    .parties-inline { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; page-break-inside: avoid; }
    .parties-inline .party { background: transparent; border: none; padding: 0; border-left: 3px solid ${colors.primary}; padding-left: 14px; border-radius: 0; }
    table { margin-bottom: 20px; }
    th, td { border-bottom: 1px solid ${colors.border}; padding: 10px 8px; vertical-align: top; }
    th { text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.06em; color: ${colors.muted}; background: ${colors.surface}; font-weight: 600; }
    ${tableExtra}
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 22px; page-break-inside: avoid; }
    .totals { width: min(280px, 100%); }
    .totals-row { display: flex; justify-content: space-between; padding: 7px 0; gap: 20px; }
    .totals-row.total { border-top: 2px solid ${colors.text}; margin-top: 8px; padding-top: 12px; font-size: 14px; font-weight: 700; }
    .totals-row.due { color: ${colors.primary}; font-weight: 600; }
    ${totalsExtra}
    .payment { background: ${colors.paymentBg}; border: 1px solid ${colors.paymentBorder}; border-radius: 12px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; }
    .payment h3 { margin: 0 0 10px; font-size: 11px; font-weight: 600; }
    .payment-methods { margin-top: 10px; display: grid; gap: 3px; }
    .payment-grid { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
    .qr-placeholder { width: 88px; height: 88px; border: 2px dashed ${colors.border}; border-radius: 8px; display: flex; align-items: center; justify-content: center; text-align: center; color: ${colors.muted}; font-size: 8px; padding: 6px; flex-shrink: 0; }
    .signature { margin-top: 24px; page-break-inside: avoid; text-align: right; }
    .signature img { max-height: 80px; max-width: 200px; object-fit: contain; }
    .client-signature { margin-top: 24px; page-break-inside: avoid; text-align: left; }
    .client-signature img { max-height: 80px; max-width: 200px; object-fit: contain; }
    .notes { margin-bottom: 18px; padding: 14px; background: ${colors.surface}; border-radius: 10px; border: 1px solid ${colors.border}; page-break-inside: avoid; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid ${colors.border}; color: ${colors.muted}; font-size: 9px; text-align: center; page-break-inside: avoid; }
    .sidebar-layout { display: flex; gap: 24px; page-break-inside: avoid; }
    .sidebar-panel { width: 200px; flex-shrink: 0; background: ${colors.surface}; border-radius: 12px; padding: 16px; border: 1px solid ${colors.border}; }
    .sidebar-content { flex: 1; min-width: 0; }
    ${headerBand}
  `;
}
