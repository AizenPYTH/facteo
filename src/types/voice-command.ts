export type VoiceCommandItem = {
  description: string;
  quantity: number;
  unit: string;
  price_ht: number;
};

export type VoiceCommandResponse = {
  document_type: 'quote' | 'invoice';
  client: string;
  items: VoiceCommandItem[];
  vat: number | null;
  payment_terms: number | null;
  discount: number | null;
  currency: string;
  payment_method: string;
  confidence: number;
};

export type VoiceCommandDraft = {
  documentType: 'quote' | 'invoice';
  transcript: string;
  client: string;
  items: VoiceCommandItem[];
  vat: string;
  paymentTerms: string;
  discount: string;
  currency: string;
  paymentMethod: string;
  confidence: number;
};
