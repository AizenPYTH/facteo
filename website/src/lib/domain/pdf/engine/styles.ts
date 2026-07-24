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
      line-height: 1.6;
      background: ${colors.surfaceAlt};
      -webkit-font-smoothing: antialiased;
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 32px;
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    .logo {
      max-height: 68px;
      max-width: 200px;
      object-fit: contain;
      margin-bottom: 14px;
      image-rendering: -webkit-optimize-contrast;
    }
    .doc-title {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.035em;
      margin: 0 0 12px;
      color: ${colors.primary};
    }
    .meta { text-align: right; }
    .meta div { margin-bottom: 5px; }
    .company-name, .client-name {
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin-bottom: 6px;
    }
    .muted { color: ${colors.muted}; }
    .parties {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    .party {
      flex: 1;
      background: ${colors.surface};
      border: 1px solid ${colors.border};
      border-radius: 14px;
      padding: 16px 18px;
    }
    .party h3 {
      margin: 0 0 12px;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: ${colors.muted};
      font-weight: 600;
    }
    table { margin-bottom: 22px; border-collapse: collapse; width: 100%; }
    th, td {
      border-bottom: 1px solid ${colors.border};
      padding: 11px 10px;
      vertical-align: top;
    }
    th {
      text-align: left;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${colors.muted};
      background: ${colors.surface};
      font-weight: 600;
    }
    td { font-size: 10.5px; }
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .totals {
      width: min(300px, 100%);
      background: ${colors.surface};
      border: 1px solid ${colors.border};
      border-radius: 14px;
      padding: 14px 16px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      gap: 24px;
      color: ${colors.muted};
    }
    .totals-row.total {
      border-top: 1.5px solid ${colors.border};
      margin-top: 8px;
      padding-top: 12px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: ${colors.text};
    }
    .totals-row.due {
      color: ${colors.primary};
      font-weight: 600;
      padding-top: 4px;
    }
    .payment {
      background: ${colors.paymentBg};
      border: 1px solid ${colors.paymentBorder};
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .payment h3 { margin: 0 0 10px; font-size: 11px; font-weight: 600; letter-spacing: -0.01em; }
    .payment-methods {
      margin-top: 10px;
      display: grid;
      gap: 4px;
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
      border: 1.5px dashed ${colors.border};
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: ${colors.muted};
      font-size: 8px;
      padding: 6px;
      flex-shrink: 0;
      background: #fff;
    }
    .signature {
      margin-top: 28px;
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
      margin-top: 28px;
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
      margin-bottom: 20px;
      padding: 14px 16px;
      background: ${colors.surface};
      border-radius: 12px;
      border: 1px solid ${colors.border};
      page-break-inside: avoid;
      line-height: 1.55;
    }
    .footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid ${colors.border};
      color: ${colors.muted};
      font-size: 8.5px;
      letter-spacing: 0.02em;
      text-align: center;
      page-break-inside: avoid;
    }
  `;
}
