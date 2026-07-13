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
      ? `.totals { background: ${colors.paymentBg}; border: 1px solid ${colors.paymentBorder}; border-radius: 12px; padding: 12px; }`
      : totalsStyle === 'boxed'
        ? `.totals { border: 2px solid ${colors.border}; border-radius: 10px; padding: 12px; }`
        : totalsStyle === 'accent'
          ? `.totals-row.total { background: ${colors.primary}; color: #fff; padding: 10px 12px; border-radius: 8px; margin-top: 8px; border-top: none; }`
          : '';

  const headerBand =
    headerStyle === 'band' || layout === 'banner' || layout === 'stripe'
      ? `.header-band { background: ${colors.primary}; color: #fff; padding: 20px 24px; border-radius: ${layout === 'stripe' ? '0' : '12px'}; margin-bottom: 24px; }
         .header-band .doc-title, .header-band .meta, .header-band .meta div { color: #fff; }
         .header-band .logo { filter: brightness(0) invert(1); }`
      : headerStyle === 'boxed'
        ? `.header { border: 2px solid ${colors.border}; border-radius: 12px; padding: 16px; }`
        : headerStyle === 'underline'
          ? `.doc-title { border-bottom: 3px solid ${colors.primary}; padding-bottom: 8px; }`
          : '';

  return `
    @page { size: A4; margin: 16mm 14mm 20mm 14mm; }
    * { box-sizing: border-box; }
    html, body {
      font-family: ${template.fontFamily};
      color: ${colors.text};
      font-size: 10.5px;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      background: ${colors.surfaceAlt};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
    .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; page-break-inside: avoid; }
    .header-center { flex-direction: column; align-items: center; text-align: center; }
    .header-split .meta { text-align: left; }
    .logo { max-height: 72px; max-width: 220px; object-fit: contain; margin-bottom: 10px; image-rendering: -webkit-optimize-contrast; }
    .logo-center { margin-left: auto; margin-right: auto; }
    .logo-right { margin-left: auto; display: block; }
    .doc-title { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 8px; color: ${colors.primary}; }
    .meta { text-align: ${template.titleAlign}; }
    .meta div { margin-bottom: 3px; }
    .company-name, .client-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .muted { color: ${colors.muted}; }
    .parties { display: flex; gap: 20px; margin-bottom: 22px; page-break-inside: avoid; }
    .party { flex: 1; background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 14px; }
    .party h3 { margin: 0 0 8px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: ${colors.muted}; font-weight: 600; }
    .parties-inline { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .parties-inline .party { background: transparent; border: none; padding: 0; border-left: 3px solid ${colors.primary}; padding-left: 12px; border-radius: 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    th, td { border-bottom: 1px solid ${colors.border}; padding: 8px 6px; vertical-align: top; }
    th { text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.06em; color: ${colors.muted}; background: ${colors.surface}; font-weight: 600; }
    td.num, th.num { text-align: right; white-space: nowrap; }
    ${tableExtra}
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 18px; page-break-inside: avoid; }
    .totals { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; gap: 16px; }
    .totals-row.total { border-top: 2px solid ${colors.text}; margin-top: 6px; padding-top: 10px; font-size: 14px; font-weight: 700; }
    .totals-row.due { color: ${colors.primary}; font-weight: 600; }
    ${totalsExtra}
    .payment { background: ${colors.paymentBg}; border: 1px solid ${colors.paymentBorder}; border-radius: 12px; padding: 14px; margin-bottom: 16px; page-break-inside: avoid; }
    .payment h3 { margin: 0 0 8px; font-size: 11px; font-weight: 600; }
    .payment-methods { margin-top: 8px; display: grid; gap: 2px; }
    .payment-grid { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .qr-placeholder { width: 88px; height: 88px; border: 2px dashed ${colors.border}; border-radius: 8px; display: flex; align-items: center; justify-content: center; text-align: center; color: ${colors.muted}; font-size: 8px; padding: 6px; flex-shrink: 0; }
    .signature { margin-top: 20px; page-break-inside: avoid; text-align: right; }
    .signature img { max-height: 80px; max-width: 220px; object-fit: contain; }
    .client-signature { margin-top: 20px; page-break-inside: avoid; text-align: left; }
    .client-signature img { max-height: 80px; max-width: 220px; object-fit: contain; }
    .notes { margin-bottom: 14px; padding: 12px; background: ${colors.surface}; border-radius: 10px; border: 1px solid ${colors.border}; page-break-inside: avoid; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid ${colors.border}; color: ${colors.muted}; font-size: 9px; text-align: center; page-break-inside: avoid; }
    .sidebar-layout { display: flex; gap: 24px; }
    .sidebar-panel { width: 200px; flex-shrink: 0; background: ${colors.surface}; border-radius: 12px; padding: 16px; border: 1px solid ${colors.border}; }
    .sidebar-content { flex: 1; min-width: 0; }
    ${headerBand}
  `;
}
