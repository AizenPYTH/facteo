export type Product = {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  vatRate: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormValues = {
  name: string;
  description: string;
  unitPrice: string;
  vatRate: string;
  unit: string;
};

export function createEmptyProductFormValues(): ProductFormValues {
  return {
    name: '',
    description: '',
    unitPrice: '',
    vatRate: '20',
    unit: 'unité',
  };
}
