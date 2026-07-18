export type ProductType = 'product' | 'service';

export type Product = {
  id: string;
  type: ProductType;
  name: string;
  description: string | null;
  unitPrice: number;
  priceTtc: number | null;
  vatRate: number;
  unit: string;
  reference: string | null;
  sku: string | null;
  barcodeEan: string | null;
  category: string | null;
  brand: string | null;
  supplier: string | null;
  stockQuantity: number;
  stockAlertThreshold: number;
  notes: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormValues = {
  name: string;
  description: string;
  unitPrice: string;
  priceTtc: string;
  vatRate: string;
  unit: string;
  reference: string;
  sku: string;
  barcodeEan: string;
  category: string;
  brand: string;
  supplier: string;
  stockQuantity: string;
  stockAlertThreshold: string;
  notes: string;
  imageUrl: string;
  isActive: boolean;
};

export function createEmptyProductFormValues(): ProductFormValues {
  return {
    name: '',
    description: '',
    unitPrice: '0',
    priceTtc: '',
    vatRate: '20',
    unit: 'unité',
    reference: '',
    sku: '',
    barcodeEan: '',
    category: '',
    brand: '',
    supplier: '',
    stockQuantity: '0',
    stockAlertThreshold: '0',
    notes: '',
    imageUrl: '',
    isActive: true,
  };
}

export function mapProductToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    unitPrice: String(product.unitPrice),
    priceTtc: product.priceTtc === null ? '' : String(product.priceTtc),
    vatRate: String(product.vatRate),
    unit: product.unit,
    reference: product.reference ?? '',
    sku: product.sku ?? '',
    barcodeEan: product.barcodeEan ?? '',
    category: product.category ?? '',
    brand: product.brand ?? '',
    supplier: product.supplier ?? '',
    stockQuantity: String(product.stockQuantity ?? 0),
    stockAlertThreshold: String(product.stockAlertThreshold ?? 0),
    notes: product.notes ?? '',
    imageUrl: product.imageUrl ?? '',
    isActive: product.isActive,
  };
}
