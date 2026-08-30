export type ProductImageAnalysis = {
  title: string;
  brand: string;
  model: string;
  reference: string;
  description: string;
  price_ttc: number | null;
  price_ht: number | null;
  /** null when source does not reliably provide VAT — never invent client-side */
  vat: number | null;
  currency: string;
  unit: string;
  quantity: number;
  confidence: number;
  sku?: string;
  ean?: string;
  source_url?: string;
  image_url?: string;
  products?: ProductImageAnalysis[];
};

export type ProductImageAnalysisInput = {
  imageBase64: string;
  mimeType: string;
  /** Optional scanned barcode hint for the vision model (never invents catalog data alone) */
  barcodeHint?: string;
};
