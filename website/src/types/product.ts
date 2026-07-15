export type ProductType = 'product' | 'service';

export type Product = {
  id: string;
  type: ProductType;
  name: string;
  description: string | null;
  unitPrice: number;
  vatRate: number;
  unit: string;
  reference: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormValues = {
  name: string;
  description: string;
  unitPrice: string;
  vatRate: string;
  unit: string;
  reference: string;
  isActive: boolean;
};

export function createEmptyProductFormValues(): ProductFormValues {
  return {
    name: '',
    description: '',
    unitPrice: '0',
    vatRate: '20',
    unit: 'unité',
    reference: '',
    isActive: true,
  };
}

export function mapProductToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    unitPrice: String(product.unitPrice),
    vatRate: String(product.vatRate),
    unit: product.unit,
    reference: product.reference ?? '',
    isActive: product.isActive,
  };
}
