/** Row types for FACTEO Supabase tables. */

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  siret: string | null;
  vat_number: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Omit<ProfileInsert, 'id'>;

export type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  siren: string | null;
  siret: string | null;
  vat_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientInsert = {
  id?: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  siren?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ClientUpdate = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  siren?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  notes?: string | null;
  updated_at?: string;
};

export type InvoiceRow = {
  id: string;
  user_id: string;
  client_id: string | null;
  number: string;
  status: string;
  total: number | null;
  issued_at: string | null;
  created_at: string;
};

export type InvoiceWithClient = InvoiceRow & {
  clients: Pick<ClientRow, 'name'> | Pick<ClientRow, 'name'>[] | null;
};

export type ProductRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  unit_price: number;
  vat_rate: number;
  unit: string;
  created_at: string;
  updated_at: string;
};

export type ProductInsert = {
  id?: string;
  user_id: string;
  name: string;
  description?: string | null;
  unit_price: number;
  vat_rate: number;
  unit: string;
  created_at?: string;
  updated_at?: string;
};

export type ProductUpdate = {
  name?: string;
  description?: string | null;
  unit_price?: number;
  vat_rate?: number;
  unit?: string;
  updated_at?: string;
};

export type QuoteRow = {
  id: string;
  user_id: string;
  client_id: string | null;
  number: string;
  status: string;
  subtotal_ht: number;
  total_vat: number;
  total_ttc: number;
  issued_at: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteLineRow = {
  id: string;
  quote_id: string;
  user_id: string;
  product_id: string | null;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  line_total_ht: number;
  created_at: string;
};

export type QuoteInsert = {
  id?: string;
  user_id: string;
  client_id?: string | null;
  number: string;
  status?: string;
  subtotal_ht: number;
  total_vat: number;
  total_ttc: number;
  issued_at?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type QuoteLineInsert = {
  id?: string;
  quote_id: string;
  user_id: string;
  product_id?: string | null;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  line_total_ht: number;
  created_at?: string;
};

export type QuoteWithClient = QuoteRow & {
  clients:
    | Pick<ClientRow, 'name' | 'company'>
    | Pick<ClientRow, 'name' | 'company'>[]
    | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      clients: {
        Row: ClientRow;
        Insert: ClientInsert;
        Update: ClientUpdate;
        Relationships: [];
      };
      invoices: {
        Row: InvoiceRow;
        Insert: Omit<InvoiceRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<InvoiceRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [];
      };
      quotes: {
        Row: QuoteRow;
        Insert: QuoteInsert;
        Update: Partial<QuoteInsert>;
        Relationships: [];
      };
      quote_lines: {
        Row: QuoteLineRow;
        Insert: QuoteLineInsert;
        Update: Partial<QuoteLineInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
