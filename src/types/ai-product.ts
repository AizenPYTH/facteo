export type ProductImageAnalysis = {
  title: string;
  brand: string;
  model: string;
  reference: string;
  description: string;
  price_ttc: number | null;
  price_ht: number | null;
  vat: number | null;
  currency: string;
  unit: string;
  quantity: number;
  confidence: number;
};

export type ProductImageAnalysisInput = {
  imageBase64: string;
  mimeType: string;
};
