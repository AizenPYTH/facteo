import { getPdfLayoutStyles } from '@/lib/pdf/engine/layout';

export function getPdfStyles(): string {
  const colors = {
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    surface: '#F9FAFB',
    surfaceAlt: '#FFFFFF',
    primary: '#2563EB',
    paymentBg: '#EFF6FF',
    paymentBorder: '#BFDBFE',
  };

  return `
    ${getPdfLayoutStyles()}
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Helvetica, Arial, sans-serif;
      color: ${colors.text};
      font-size: 10.5px;
      line-height: 1.55;
      background: ${colors.surfaceAlt};
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 28px;
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    .logo {
      max-height: 68px;
      max-width: 200px;
      object-fit: contain;
      margin-bottom: 12px;
      image-rendering: -webkit-optimize-contrast;
    }
    .doc-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin: 0 0 10px;
      color: ${colors.primary};
    }
    .meta { text-align: right; }
    .meta div { margin-bottom: 4px; }
    .company-name, .client-name {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .muted { color: ${colors.muted}; }
    .parties {
      display: flex;
      gap: 20px;
      margin-bottom: 26px;
      page-break-inside: avoid;
    }
    .party {
      flex: 1;
      background: ${colors.surface};
      border: 1px solid ${colors.border};
      border-radius: 12px;
      padding: 16px;
    }
    .party h3 {
      margin: 0 0 10px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${colors.muted};
      font-weight: 600;
    }
    table { margin-bottom: 20px; }
    th, td {
      border-bottom: 1px solid ${colors.border};
      padding: 10px 8px;
      vertical-align: top;
    }
    th {
      text-align: left;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: ${colors.muted};
      background: ${colors.surface};
      font-weight: 600;
    }
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .totals { width: min(280px, 100%); }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      gap: 20px;
    }
    .totals-row.total {
      border-top: 2px solid ${colors.text};
      margin-top: 8px;
      padding-top: 12px;
      font-size: 14px;
      font-weight: 700;
    }
    .totals-row.due {
      color: ${colors.primary};
      font-weight: 600;
    }
    .payment {
      background: ${colors.paymentBg};
      border: 1px solid ${colors.paymentBorder};
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .payment h3 { margin: 0 0 10px; font-size: 11px; font-weight: 600; }
    .payment-methods {
      margin-top: 10px;
      display: grid;
      gap: 3px;
    }
    .payment-grid {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: flex-start;
    }
    .qr-placeholder {
      width: 88px;
      height: 88px;
      border: 2px dashed ${colors.border};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: ${colors.muted};
      font-size: 8px;
      padding: 6px;
      flex-shrink: 0;
    }
    .signature {
      margin-top: 24px;
      page-break-inside: avoid;
      text-align: right;
    }
    .signature img {
      max-height: 80px;
      max-width: 200px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
    }
    .client-signature {
      margin-top: 24px;
      page-break-inside: avoid;
      text-align: left;
    }
    .client-signature img {
      max-height: 80px;
      max-width: 200px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
    }
    .notes {
      margin-bottom: 18px;
      padding: 14px;
      background: ${colors.surface};
      border-radius: 10px;
      border: 1px solid ${colors.border};
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid ${colors.border};
      color: ${colors.muted};
      font-size: 9px;
      text-align: center;
      page-break-inside: avoid;
    }
  `;
}
