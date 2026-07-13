/** Row types for FACTEO Supabase tables. */

import type { PaymentMethodId } from '@/types/payment-methods';

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
  iban: string | null;
  bic: string | null;
  payment_methods: PaymentMethodId[] | null;
  logo_url: string | null;
  signature_url: string | null;
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
  iban?: string | null;
  bic?: string | null;
  payment_methods?: PaymentMethodId[] | null;
  logo_url?: string | null;
  signature_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Omit<ProfileInsert, 'id'>;

export type ClientRow = {
  id: string;
  user_id: string;
  company_id: string | null;
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
  deleted_at: string | null;
};

export type ClientInsert = {
  id?: string;
  user_id: string;
  company_id?: string | null;
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
  deleted_at?: string | null;
};

export type InvoiceRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  client_id: string | null;
  quote_id: string | null;
  number: string;
  status: string;
  subtotal_ht: number;
  total_vat: number;
  total_ttc: number;
  total: number | null;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  stripe_payment_link: string | null;
  stripe_checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type InvoiceWithClient = InvoiceRow & {
  clients:
    | Pick<ClientRow, 'name' | 'company' | 'email'>
    | Pick<ClientRow, 'name' | 'company' | 'email'>[]
    | null;
};

export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  user_id: string;
  product_id: string | null;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  discount_percent: number;
  line_total_ht: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type InvoiceItemInsert = {
  id?: string;
  invoice_id: string;
  user_id: string;
  product_id?: string | null;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  discount_percent?: number;
  line_total_ht: number;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceInsert = {
  id?: string;
  user_id: string;
  company_id?: string;
  client_id?: string | null;
  quote_id?: string | null;
  number: string;
  status?: string;
  subtotal_ht: number;
  total_vat: number;
  total_ttc: number;
  issued_at?: string | null;
  due_at?: string | null;
  paid_at?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  stripe_payment_link?: string | null;
  stripe_checkout_session_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InvoicePaymentRow = {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
};

export type InvoicePaymentInsert = {
  id?: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  paid_at?: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type SettingsRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  currency: string;
  default_vat_rate: number;
  quote_prefix: string;
  invoice_prefix: string;
  quote_validity_days: number;
  next_quote_number: number;
  next_invoice_number: number;
  locale: string;
  payment_terms_days: number;
  quote_footer: string | null;
  invoice_footer: string | null;
  quote_template_id: string | null;
  invoice_template_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SettingsUpdate = {
  currency?: string;
  default_vat_rate?: number;
  quote_prefix?: string;
  invoice_prefix?: string;
  quote_validity_days?: number;
  next_quote_number?: number;
  next_invoice_number?: number;
  locale?: string;
  payment_terms_days?: number;
  quote_footer?: string | null;
  invoice_footer?: string | null;
  quote_template_id?: string | null;
  invoice_template_id?: string | null;
  company_id?: string | null;
  updated_at?: string;
};

export type ProductRow = {
  id: string;
  user_id: string;
  type: 'product' | 'service';
  name: string;
  description: string | null;
  unit_price: number;
  vat_rate: number;
  unit: string;
  reference: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ProductInsert = {
  id?: string;
  user_id: string;
  type?: 'product' | 'service';
  name: string;
  description?: string | null;
  unit_price: number;
  vat_rate: number;
  unit: string;
  reference?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductUpdate = {
  type?: 'product' | 'service';
  name?: string;
  description?: string | null;
  unit_price?: number;
  vat_rate?: number;
  unit?: string;
  reference?: string | null;
  is_active?: boolean;
  updated_at?: string;
  deleted_at?: string | null;
};

export type QuoteRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  client_id: string | null;
  converted_invoice_id: string | null;
  number: string;
  status: string;
  subtotal_ht: number;
  total_vat: number;
  total_ttc: number;
  issued_at: string | null;
  valid_until: string | null;
  payment_terms_days: number | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type QuoteItemRow = {
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
  discount_percent: number;
  line_total_ht: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type QuoteInsert = {
  id?: string;
  user_id: string;
  company_id?: string;
  client_id?: string | null;
  converted_invoice_id?: string | null;
  number: string;
  status?: string;
  subtotal_ht: number;
  total_vat: number;
  total_ttc: number;
  issued_at?: string | null;
  valid_until?: string | null;
  payment_terms_days?: number | null;
  notes?: string | null;
  internal_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type QuoteItemInsert = {
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
  discount_percent?: number;
  line_total_ht: number;
  created_at?: string;
  updated_at?: string;
};

/** @deprecated Use QuoteItemInsert */
export type QuoteLineInsert = QuoteItemInsert;

/** @deprecated Use QuoteItemRow */
export type QuoteLineRow = QuoteItemRow;

export type QuoteWithClient = QuoteRow & {
  clients:
    | Pick<ClientRow, 'name' | 'company' | 'email'>
    | Pick<ClientRow, 'name' | 'company' | 'email'>[]
    | null;
};

export type SentDocumentRow = {
  id: string;
  user_id: string;
  document_type: 'quote' | 'invoice';
  document_id: string;
  document_number: string;
  recipient_email: string;
  subject: string;
  message: string | null;
  channel: 'mail' | 'share' | 'resend';
  status: 'draft' | 'sent' | 'failed';
  provider_message_id: string | null;
  sent_at: string;
  created_at: string;
};

export type SentDocumentInsert = {
  id?: string;
  user_id: string;
  document_type: 'quote' | 'invoice';
  document_id: string;
  document_number: string;
  recipient_email: string;
  subject: string;
  message?: string | null;
  channel?: 'mail' | 'share' | 'resend';
  status?: 'draft' | 'sent' | 'failed';
  provider_message_id?: string | null;
  sent_at?: string;
  created_at?: string;
};

export type PushDeviceTokenRow = {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PushDeviceTokenInsert = {
  id?: string;
  user_id: string;
  expo_push_token: string;
  platform?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type NotificationPreferencesRow = {
  user_id: string;
  invoice_overdue_enabled: boolean;
  quote_accepted_enabled: boolean;
  payment_received_enabled: boolean;
  due_date_reminder_enabled: boolean;
  due_date_reminder_days: number;
  created_at: string;
  updated_at: string;
};

export type NotificationPreferencesInsert = {
  user_id: string;
  invoice_overdue_enabled?: boolean;
  quote_accepted_enabled?: boolean;
  payment_received_enabled?: boolean;
  due_date_reminder_enabled?: boolean;
  due_date_reminder_days?: number;
  created_at?: string;
  updated_at?: string;
};

export type NotificationPreferencesUpdate = Omit<NotificationPreferencesInsert, 'user_id'>;

export type StripePaymentSessionRow = {
  id: string;
  user_id: string;
  invoice_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_link_url: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'canceled' | 'failed';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type StripePaymentSessionInsert = {
  id?: string;
  user_id: string;
  invoice_id: string;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  payment_link_url?: string | null;
  amount: number;
  currency?: string;
  status?: 'pending' | 'processing' | 'succeeded' | 'canceled' | 'failed';
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlanRow = {
  id: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  max_clients: number | null;
  max_quotes: number | null;
  max_invoices: number | null;
  features: Record<string, unknown>;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  app_store_product_id: string | null;
  play_store_product_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentSignatureRow = {
  id: string;
  user_id: string;
  document_type: 'quote' | 'invoice';
  document_id: string;
  signature_url: string;
  signer_name: string | null;
  signed_at: string;
  created_at: string;
  updated_at: string;
};

export type CompanyRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  siret: string | null;
  vat_number: string | null;
  iban: string | null;
  bic: string | null;
  payment_methods: unknown;
  logo_url: string | null;
  signature_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyInsert = Partial<CompanyRow> & { name: string };
export type CompanyUpdate = Partial<Omit<CompanyRow, 'id' | 'created_at'>>;

export type CompanyMemberRow = {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  created_at: string;
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
      companies: {
        Row: CompanyRow;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
        Relationships: [];
      };
      company_members: {
        Row: CompanyMemberRow;
        Insert: Partial<CompanyMemberRow> & { company_id: string; user_id: string };
        Update: Partial<CompanyMemberRow>;
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
        Insert: InvoiceInsert;
        Update: Partial<InvoiceInsert>;
        Relationships: [
          {
            foreignKeyName: 'invoices_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoice_payments_invoice_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'invoice_payments';
            referencedColumns: ['invoice_id'];
          },
        ];
      };
      invoice_items: {
        Row: InvoiceItemRow;
        Insert: InvoiceItemInsert;
        Update: Partial<InvoiceItemInsert>;
        Relationships: [
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      invoice_payments: {
        Row: InvoicePaymentRow;
        Insert: InvoicePaymentInsert;
        Update: Partial<InvoicePaymentInsert>;
        Relationships: [
          {
            foreignKeyName: 'invoice_payments_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      settings: {
        Row: SettingsRow;
        Insert: Omit<SettingsRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: SettingsUpdate;
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
        Relationships: [
          {
            foreignKeyName: 'quotes_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
        ];
      };
      quote_items: {
        Row: QuoteItemRow;
        Insert: QuoteItemInsert;
        Update: Partial<QuoteItemInsert>;
        Relationships: [];
      };
      sent_documents: {
        Row: SentDocumentRow;
        Insert: SentDocumentInsert;
        Update: Partial<SentDocumentInsert>;
        Relationships: [];
      };
      push_device_tokens: {
        Row: PushDeviceTokenRow;
        Insert: PushDeviceTokenInsert;
        Update: Partial<PushDeviceTokenInsert>;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreferencesRow;
        Insert: NotificationPreferencesInsert;
        Update: NotificationPreferencesUpdate;
        Relationships: [];
      };
      stripe_payment_sessions: {
        Row: StripePaymentSessionRow;
        Insert: StripePaymentSessionInsert;
        Update: Partial<StripePaymentSessionInsert>;
        Relationships: [
          {
            foreignKeyName: 'stripe_payment_sessions_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Partial<SubscriptionRow> & { user_id: string };
        Update: Partial<SubscriptionRow>;
        Relationships: [];
      };
      subscription_plans: {
        Row: SubscriptionPlanRow;
        Insert: Partial<SubscriptionPlanRow> & { id: string; display_name: string };
        Update: Partial<SubscriptionPlanRow>;
        Relationships: [];
      };
      document_signatures: {
        Row: DocumentSignatureRow;
        Insert: Partial<DocumentSignatureRow> & {
          user_id: string;
          document_type: 'quote' | 'invoice';
          document_id: string;
          signature_url: string;
        };
        Update: Partial<DocumentSignatureRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_profile_exists: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      ensure_user_subscription: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_subscription_usage: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>;
      };
      check_plan_limit: {
        Args: { p_resource: string };
        Returns: Record<string, unknown>;
      };
      reserve_next_quote_number: {
        Args: { p_company_id: string };
        Returns: string;
      };
      reserve_next_invoice_number: {
        Args: { p_company_id: string };
        Returns: string;
      };
      create_company_for_user: {
        Args: { p_name: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
