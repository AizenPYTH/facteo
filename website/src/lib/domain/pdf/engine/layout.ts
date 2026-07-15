/** Marges et dimensions d'impression A4 — alignées sur les standards SaaS (Pennylane, Qonto, Indy). */
export const PDF_LAYOUT = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  marginTopMm: 20,
  marginRightMm: 18,
  marginBottomMm: 24,
  marginLeftMm: 18,
  /** Largeur de rendu HTML à 96 DPI (210 mm). */
  renderWidthPx: 794,
  renderHeightPx: 1123,
} as const;

export function getPdfPageMarginsCss(): string {
  const { marginTopMm, marginRightMm, marginBottomMm, marginLeftMm } = PDF_LAYOUT;
  return `${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm`;
}

export function getContentWidthMm(): number {
  return PDF_LAYOUT.pageWidthMm - PDF_LAYOUT.marginLeftMm - PDF_LAYOUT.marginRightMm;
}

export function getContentHeightMm(): number {
  return PDF_LAYOUT.pageHeightMm - PDF_LAYOUT.marginTopMm - PDF_LAYOUT.marginBottomMm;
}

export function getPxPerMm(): number {
  return PDF_LAYOUT.renderWidthPx / PDF_LAYOUT.pageWidthMm;
}

export function getContentWidthPx(): number {
  return Math.round(getContentWidthMm() * getPxPerMm());
}

/** Styles structurels communs à tous les modèles (marges, page, sauts). */
export function getPdfLayoutStyles(): string {
  const pageMargins = getPdfPageMarginsCss();

  return `
    @page { size: A4; margin: ${pageMargins}; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      overflow: visible;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: ${PDF_LAYOUT.pageWidthMm}mm;
      min-height: ${PDF_LAYOUT.pageHeightMm}mm;
      max-width: ${PDF_LAYOUT.pageWidthMm}mm;
      margin: 0 auto;
      padding: ${pageMargins};
      background: #ffffff;
      overflow: visible;
    }
    @media print {
      .page {
        padding: 0;
        min-height: auto;
      }
    }
    .section { margin-bottom: 22px; }
    .section-tight { margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    tbody { page-break-inside: auto; }
    th, td {
      overflow-wrap: break-word;
      word-wrap: break-word;
      hyphens: auto;
    }
    td.num, th.num { white-space: nowrap; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    .lines-table th:nth-child(1), .lines-table td:nth-child(1) { width: 30%; }
    .lines-table th:nth-child(2), .lines-table td:nth-child(2) { width: 7%; }
    .lines-table th:nth-child(3), .lines-table td:nth-child(3) { width: 9%; }
    .lines-table th:nth-child(4), .lines-table td:nth-child(4) { width: 12%; }
    .lines-table th:nth-child(5), .lines-table td:nth-child(5) { width: 9%; }
    .lines-table th:nth-child(6), .lines-table td:nth-child(6) { width: 8%; }
    .lines-table th:nth-child(7), .lines-table td:nth-child(7) { width: 13%; }
    .vat-table th:nth-child(1), .vat-table td:nth-child(1) { width: 40%; }
    .vat-table th:nth-child(2), .vat-table td:nth-child(2) { width: 30%; }
    .vat-table th:nth-child(3), .vat-table td:nth-child(3) { width: 30%; }
  `;
}
