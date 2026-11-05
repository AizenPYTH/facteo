/** Row types for INVEQ Supabase tables. */

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
  avatar_url: string | null;
  activity_type: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
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
  avatar_url?: string | null;
  activity_type?: string | null;
  onboarding_completed?: boolean;
  onboarding_step?: number;
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
  electronic_invoice_status: string | null;
  superpdp_invoice_id: number | null;
  superpdp_external_id: string | null;
  electronic_invoice_format: string | null;
  electronic_invoice_sent_at: string | null;
  electronic_invoice_received_at: string | null;
  electronic_invoice_last_error: string | null;
  electronic_invoice_updated_at: string | null;
  electronic_buyer_address: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  delivery_country: string | null;
  operation_category: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  /** Relances automatiques pour cette facture (migration 20261105140000). */
  reminders_enabled?: boolean;
  /** standard | deposit | balance (migration 20261105120000). */
  billing_role?: string;
  deposit_percent?: number | null;
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
  /** Null pour les lignes antérieures à la séparation titre / description. */
  title: string | null;
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
  title?: string | null;
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
  reminders_enabled?: boolean;
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
  show_logo?: boolean;
  number_include_year: boolean;
  number_separator: string;
  number_digits: number;
  invoice_title: string | null;
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
  show_logo?: boolean;
  number_include_year?: boolean;
  number_separator?: string;
  number_digits?: number;
  invoice_title?: string | null;
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
  price_ttc: number | null;
  vat_rate: number;
  unit: string;
  reference: string | null;
  sku: string | null;
  barcode_ean: string | null;
  category: string | null;
  brand: string | null;
  supplier: string | null;
  stock_quantity: number;
  stock_alert_threshold: number;
  notes: string | null;
  image_url: string | null;
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
  price_ttc?: number | null;
  vat_rate: number;
  unit: string;
  reference?: string | null;
  sku?: string | null;
  barcode_ean?: string | null;
  category?: string | null;
  brand?: string | null;
  supplier?: string | null;
  stock_quantity?: number;
  stock_alert_threshold?: number;
  notes?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductUpdate = {
  type?: 'product' | 'service';
  name?: string;
  description?: string | null;
  unit_price?: number;
  price_ttc?: number | null;
  vat_rate?: number;
  unit?: string;
  reference?: string | null;
  sku?: string | null;
  barcode_ean?: string | null;
  category?: string | null;
  brand?: string | null;
  supplier?: string | null;
  stock_quantity?: number;
  stock_alert_threshold?: number;
  notes?: string | null;
  image_url?: string | null;
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
  /** Null pour les lignes antérieures à la séparation titre / description. */
  title: string | null;
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
  title?: string | null;
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
  max_documents_per_month: number | null;
  max_siren_searches_per_month: number | null;
  max_companies: number | null;
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
  siren: string | null;
  vat_number: string | null;
  has_vat_on_debits: boolean;
  vat_regime: string | null;
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

/**
 * Facture électronique reçue via SUPER PDP.
 * Ce type manquait au schéma généré ; il est ajouté ici sans modifier la
 * fonctionnalité de facturation électronique elle-même.
 */
export type SuperPdpReceivedInvoiceRow = {
  id: string;
  company_id: string;
  superpdp_invoice_id: number;
  supplier_name: string | null;
  supplier_number: string | null;
  invoice_number: string | null;
  issue_date: string | null;
  currency: string;
  subtotal_ht: string | number | null;
  total_vat: string | number | null;
  total_ttc: string | number | null;
  latest_status_code: string | null;
  electronic_invoice_status: string | null;
  received_at: string | null;
  document_content_type: string | null;
  structured_payload: Record<string, unknown> | null;
  raw_events: Record<string, unknown>[];
  imported_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Preuve d'acceptation ou de refus d'un devis en ligne (jamais modifiée). */
export type QuoteAcceptanceRow = {
  id: string;
  quote_id: string;
  quote_number: string;
  user_id: string;
  company_id: string | null;
  link_id: string | null;
  decision: 'accepted' | 'rejected';
  signer_name: string;
  signer_email: string | null;
  signature_image: string | null;
  comment: string | null;
  consent_text: string | null;
  total_ttc: number;
  document_snapshot: unknown;
  document_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

/** Lien public vers un document. Seule l'empreinte du jeton est stockée. */
export type DocumentShareLinkRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  document_type: 'quote' | 'invoice';
  document_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
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
      superpdp_received_invoices: {
        Row: SuperPdpReceivedInvoiceRow;
        Insert: Partial<SuperPdpReceivedInvoiceRow> & { company_id: string; superpdp_invoice_id: number };
        Update: Partial<SuperPdpReceivedInvoiceRow>;
        Relationships: [];
      };
      quote_acceptances: {
        Row: QuoteAcceptanceRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      document_share_links: {
        Row: DocumentShareLinkRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      reminder_settings: {
        Row: {
          company_id: string;
          enabled: boolean;
          before_due_enabled: boolean;
          due_enabled: boolean;
          after_7_enabled: boolean;
          after_15_enabled: boolean;
          include_payment_link: boolean;
          templates: unknown;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          company_id: string;
          enabled?: boolean;
          before_due_enabled?: boolean;
          due_enabled?: boolean;
          after_7_enabled?: boolean;
          after_15_enabled?: boolean;
          include_payment_link?: boolean;
          templates?: unknown;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<{
          enabled: boolean;
          before_due_enabled: boolean;
          due_enabled: boolean;
          after_7_enabled: boolean;
          after_15_enabled: boolean;
          include_payment_link: boolean;
          templates: unknown;
          updated_at: string;
          updated_by: string | null;
        }>;
        Relationships: [];
      };
      invoice_reminders: {
        Row: {
          id: string;
          invoice_id: string;
          company_id: string | null;
          user_id: string;
          stage: string;
          status: string;
          recipient_email: string | null;
          subject: string | null;
          body: string | null;
          amount_due: number | null;
          provider_message_id: string | null;
          error: string | null;
          triggered_by: string | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      invoice_next_reminder: {
        Args: { p_invoice_id: string };
        Returns: unknown;
      };
      quote_billing_state: {
        Args: { p_quote_id: string };
        Returns: unknown;
      };
      create_deposit_invoice: {
        Args: { p_quote_id: string; p_mode: 'percent' | 'amount'; p_value: number };
        Returns: unknown;
      };
      create_final_invoice_from_quote: {
        Args: { p_quote_id: string };
        Returns: unknown;
      };
      create_document_share_link: {
        Args: { p_document_type: 'quote' | 'invoice'; p_document_id: string };
        Returns: string;
      };
      revoke_document_share_links: {
        Args: { p_document_type: 'quote' | 'invoice'; p_document_id: string };
        Returns: number;
      };
      get_public_document: {
        Args: { p_token: string };
        Returns: unknown;
      };
      respond_to_public_quote: {
        Args: {
          p_token: string;
          p_decision: 'accepted' | 'rejected';
          p_signer_name: string;
          p_signer_email?: string | null;
          p_signature?: string | null;
          p_comment?: string | null;
          p_consent?: boolean;
        };
        Returns: unknown;
      };
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
      consume_siren_search: {
        Args: Record<PropertyKey, never>;
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
      delete_company: {
        Args: { p_company_id: string };
        Returns: undefined;
      };
      ensure_company_settings: {
        Args: { p_company_id: string };
        Returns: string;
      };
      track_product_event: {
        Args: {
          p_event: string;
          p_platform?: string | null;
          p_attempt_id?: string | null;
          p_invoice_id?: string | null;
          p_method?: string | null;
          p_error_code?: string | null;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
