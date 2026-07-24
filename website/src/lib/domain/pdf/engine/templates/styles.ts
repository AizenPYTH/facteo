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
      line-height: 1.6;
      background: ${colors.surfaceAlt};
      -webkit-font-smoothing: antialiased;
    }
    .header { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 32px; page-break-inside: avoid; }
    .header-center { flex-direction: column; align-items: center; text-align: center; }
    .header-split .meta { text-align: left; }
    .logo { max-height: 68px; max-width: 200px; object-fit: contain; margin-bottom: 12px; image-rendering: -webkit-optimize-contrast; }
    .logo-center { margin-left: auto; margin-right: auto; }
    .logo-right { margin-left: auto; display: block; }
    .doc-title { font-size: 26px; font-weight: 700; letter-spacing: -0.035em; margin: 0 0 12px; color: ${colors.primary}; }
    .meta { text-align: ${template.titleAlign}; }
    .meta div { margin-bottom: 5px; }
    .company-name, .client-name { font-size: 13.5px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 6px; }
    .muted { color: ${colors.muted}; }
    .parties { display: flex; gap: 16px; margin-bottom: 28px; page-break-inside: avoid; }
    .party { flex: 1; background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 14px; padding: 16px 18px; }
    .party h3 { margin: 0 0 12px; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.12em; color: ${colors.muted}; font-weight: 600; }
    .parties-inline { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; page-break-inside: avoid; }
    .parties-inline .party { background: transparent; border: none; padding: 0; border-left: 3px solid ${colors.primary}; padding-left: 14px; border-radius: 0; }
    table { margin-bottom: 22px; border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid ${colors.border}; padding: 11px 10px; vertical-align: top; }
    th { text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: ${colors.muted}; background: ${colors.surface}; font-weight: 600; }
    ${tableExtra}
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 24px; page-break-inside: avoid; }
    .totals { width: min(300px, 100%); background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 14px; padding: 14px 16px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; gap: 24px; color: ${colors.muted}; }
    .totals-row.total { border-top: 1.5px solid ${colors.border}; margin-top: 8px; padding-top: 12px; font-size: 15px; font-weight: 700; letter-spacing: -0.02em; color: ${colors.text}; }
    .totals-row.due { color: ${colors.primary}; font-weight: 600; padding-top: 4px; }
    ${totalsExtra}
    .payment { background: ${colors.paymentBg}; border: 1px solid ${colors.paymentBorder}; border-radius: 14px; padding: 16px 18px; margin-bottom: 22px; page-break-inside: avoid; }
    .payment h3 { margin: 0 0 10px; font-size: 11px; font-weight: 600; letter-spacing: -0.01em; }
    .payment-methods { margin-top: 10px; display: grid; gap: 4px; }
    .payment-grid { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
    .qr-placeholder { width: 88px; height: 88px; border: 1.5px dashed ${colors.border}; border-radius: 10px; display: flex; align-items: center; justify-content: center; text-align: center; color: ${colors.muted}; font-size: 8px; padding: 6px; flex-shrink: 0; background: #fff; }
    .signature { margin-top: 28px; page-break-inside: avoid; text-align: right; }
    .signature img { max-height: 80px; max-width: 200px; object-fit: contain; }
    .client-signature { margin-top: 28px; page-break-inside: avoid; text-align: left; }
    .client-signature img { max-height: 80px; max-width: 200px; object-fit: contain; }
    .notes { margin-bottom: 20px; padding: 14px 16px; background: ${colors.surface}; border-radius: 12px; border: 1px solid ${colors.border}; page-break-inside: avoid; line-height: 1.55; }
    .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid ${colors.border}; color: ${colors.muted}; font-size: 8.5px; letter-spacing: 0.02em; text-align: center; page-break-inside: avoid; }
    .sidebar-layout { display: flex; gap: 24px; page-break-inside: avoid; }
    .sidebar-panel { width: 200px; flex-shrink: 0; background: ${colors.surface}; border-radius: 12px; padding: 16px; border: 1px solid ${colors.border}; }
    .sidebar-content { flex: 1; min-width: 0; }
    ${headerBand}
  `;
}
