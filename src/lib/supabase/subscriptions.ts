import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { resolveEffectivePlanId } from '@/lib/subscription/plans';
import type {
  EffectivePlanId,
  PlanFeatures,
  PlanLimitCheck,
  PlanResource,
  SubscriptionPlan,
  SubscriptionPlanId,
  SubscriptionSnapshot,
  SubscriptionStatus,
  SubscriptionUsage,
  UserSubscription,
} from '@/types/subscription';
import { PlanLimitError } from '@/types/subscription';
import type {
  DocumentSignatureRow,
  SubscriptionPlanRow,
  SubscriptionRow,
} from '@/types/database';

const SUBSCRIPTION_COLUMNS =
  'user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, created_at, updated_at';

const PLAN_COLUMNS =
  'id, display_name, description, sort_order, max_clients, max_quotes, max_invoices, max_documents_per_month, max_siren_searches_per_month, max_companies, features, stripe_price_id, stripe_product_id, app_store_product_id, play_store_product_id, is_active';

function mapPlanFeatures(value: unknown): PlanFeatures {
  const source = (value ?? {}) as Partial<PlanFeatures>;

  return {
    custom_logo: Boolean(source.custom_logo),
    company_signature: Boolean(source.company_signature),
    client_signature: Boolean(source.client_signature),
    pdf_templates: Boolean(source.pdf_templates),
    stripe_payments: Boolean(source.stripe_payments),
    ai_assistant: Boolean(source.ai_assistant),
    advanced_stats: Boolean(source.advanced_stats),
    siren_search: Boolean(source.siren_search),
  };
}

function mapSubscriptionPlanRow(row: SubscriptionPlanRow): SubscriptionPlan {
  return {
    id: row.id,
    displayName: row.display_name,
    description: row.description,
    sortOrder: row.sort_order,
    maxClients: row.max_clients,
    maxQuotes: row.max_quotes,
    maxInvoices: row.max_invoices,
    maxDocumentsPerMonth: row.max_documents_per_month ?? null,
    maxSirenSearchesPerMonth: row.max_siren_searches_per_month ?? null,
    maxCompanies: row.max_companies ?? null,
    features: mapPlanFeatures(row.features),
    stripePriceId: row.stripe_price_id,
    stripeProductId: row.stripe_product_id,
    appStoreProductId: row.app_store_product_id,
    playStoreProductId: row.play_store_product_id,
    isActive: row.is_active,
  };
}

function mapSubscriptionRow(row: SubscriptionRow): UserSubscription {
  const plan = row.plan as SubscriptionPlanId;

  return {
    userId: row.user_id,
    plan,
    effectivePlanId: resolveEffectivePlanId(plan),
    status: row.status as SubscriptionStatus,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    trialEndsAt: row.trial_ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUsage(value: unknown): SubscriptionUsage {
  const source = (value ?? {}) as Record<string, unknown>;

  return {
    clients: Number(source.clients ?? 0),
    quotes: Number(source.quotes ?? 0),
    invoices: Number(source.invoices ?? 0),
    documents: Number(source.documents ?? 0),
    companies: Number(source.companies ?? 0),
    sirenSearches: Number(source.siren_searches ?? source.sirenSearches ?? 0),
  };
}

export function mapPlanLimitCheck(value: unknown): PlanLimitCheck {
  const source = (value ?? {}) as Record<string, unknown>;

  return {
    allowed: Boolean(source.allowed),
    resource: (source.resource ?? 'clients') as PlanResource,
    current: Number(source.current ?? 0),
    limit: source.limit === null || source.limit === undefined ? null : Number(source.limit),
    planId: String(source.plan_id ?? source.planId ?? 'micro') as EffectivePlanId | string,
    planName: String(source.plan_name ?? source.planName ?? 'Micro'),
    status: (source.status ?? 'active') as SubscriptionStatus,
    isPremium: Boolean(source.is_premium ?? source.isPremium),
  };
}

export function isPlanLimitError(error: unknown): error is PlanLimitError {
  return error instanceof PlanLimitError;
}

export function parsePlanLimitError(error: unknown): PlanLimitError | null {
  if (error instanceof PlanLimitError) {
    return error;
  }

  if (!error || typeof error !== 'object') {
    return null;
  }

  const message = 'message' in error ? String(error.message) : '';
  const details = 'details' in error ? String(error.details ?? '') : '';
  const blob = `${message}\n${details}`;

  if (!blob.includes('PLAN_LIMIT_REACHED')) {
    return null;
  }

  const resourceMatch = blob.match(/PLAN_LIMIT_REACHED:([a-z_]+)/i);
  const resource = (resourceMatch?.[1] ?? 'documents') as PlanResource;
  let check: PlanLimitCheck;

  try {
    check = mapPlanLimitCheck(JSON.parse(details));
    if (!check.resource) {
      check.resource = resource;
    }
  } catch {
    check = {
      allowed: false,
      resource,
      current: 0,
      limit: null,
      planId: 'micro',
      planName: 'Micro',
      status: 'active',
      isPremium: false,
    };
  }

  return new PlanLimitError(check);
}

export function throwIfPlanLimitReached(error: unknown): void {
  const parsed = parsePlanLimitError(error);
  if (parsed) {
    throw parsed;
  }
}

export async function ensureUserSubscription(): Promise<void> {
  const { error } = await supabase.rpc('ensure_user_subscription');

  if (error) {
    logSupabaseError('ensureUserSubscription', error);
    throw error;
  }
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select(PLAN_COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    logSupabaseError('fetchSubscriptionPlans', error);
    throw error;
  }

  return ((data as SubscriptionPlanRow[] | null) ?? []).map(mapSubscriptionPlanRow);
}

export async function fetchUserSubscription(userId: string): Promise<UserSubscription | null> {
  await ensureUserSubscription();

  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchUserSubscription', error);
    throw error;
  }

  return data ? mapSubscriptionRow(data as SubscriptionRow) : null;
}

export async function fetchSubscriptionUsage(): Promise<SubscriptionUsage> {
  const { data, error } = await supabase.rpc('get_subscription_usage');

  if (error) {
    logSupabaseError('fetchSubscriptionUsage', error);
    throw error;
  }

  return mapUsage(data);
}

export async function checkPlanLimit(resource: PlanResource): Promise<PlanLimitCheck> {
  const { data, error } = await supabase.rpc('check_plan_limit', {
    p_resource: resource,
  });

  if (error) {
    logSupabaseError('checkPlanLimit', error);
    throw error;
  }

  return mapPlanLimitCheck(data);
}

export async function assertPlanLimit(resource: PlanResource): Promise<PlanLimitCheck> {
  const check = await checkPlanLimit(resource);

  if (!check.allowed) {
    throw new PlanLimitError(check);
  }

  return check;
}

export async function consumeSirenSearch(): Promise<PlanLimitCheck> {
  const { data, error } = await supabase.rpc('consume_siren_search');

  if (error) {
    logSupabaseError('consumeSirenSearch', error);
    throw error;
  }

  const check = mapPlanLimitCheck(data);

  if (!check.allowed) {
    throw new PlanLimitError(check);
  }

  return check;
}

export async function fetchSubscriptionSnapshot(userId: string): Promise<SubscriptionSnapshot> {
  const [subscription, plans, usage] = await Promise.all([
    fetchUserSubscription(userId),
    fetchSubscriptionPlans(),
    fetchSubscriptionUsage(),
  ]);

  if (!subscription) {
    throw new Error('Subscription not found.');
  }

  const plan =
    plans.find((entry) => entry.id === subscription.effectivePlanId) ??
    plans.find((entry) => entry.id === 'micro');

  if (!plan) {
    throw new Error('Subscription plan configuration not found.');
  }

  return {
    subscription,
    plan,
    usage,
  };
}

export type DocumentSignature = {
  id: string;
  userId: string;
  documentType: 'quote' | 'invoice';
  documentId: string;
  signatureUrl: string;
  signerName: string | null;
  signedAt: string;
  createdAt: string;
  updatedAt: string;
};

function mapDocumentSignatureRow(row: DocumentSignatureRow): DocumentSignature {
  return {
    id: row.id,
    userId: row.user_id,
    documentType: row.document_type,
    documentId: row.document_id,
    signatureUrl: row.signature_url,
    signerName: row.signer_name,
    signedAt: row.signed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchDocumentSignature(
  documentType: 'quote' | 'invoice',
  documentId: string,
): Promise<DocumentSignature | null> {
  const { data, error } = await supabase
    .from('document_signatures')
    .select('*')
    .eq('document_type', documentType)
    .eq('document_id', documentId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchDocumentSignature', error);
    throw error;
  }

  return data ? mapDocumentSignatureRow(data as DocumentSignatureRow) : null;
}

export async function upsertDocumentSignature(input: {
  userId: string;
  documentType: 'quote' | 'invoice';
  documentId: string;
  signatureUrl: string;
  signerName?: string | null;
  signedAt?: string;
}): Promise<DocumentSignature> {
  const { assertCurrentUserFeature } = await import('@/lib/subscription/enforce');
  await assertCurrentUserFeature('client_signature');
  const { data, error } = await supabase
    .from('document_signatures')
    .upsert(
      {
        user_id: input.userId,
        document_type: input.documentType,
        document_id: input.documentId,
        signature_url: input.signatureUrl,
        signer_name: input.signerName ?? null,
        signed_at: input.signedAt ?? new Date().toISOString(),
      },
      { onConflict: 'user_id,document_type,document_id' },
    )
    .select('*')
    .single();

  if (error) {
    logSupabaseError('upsertDocumentSignature', error);
    throw error;
  }

  return mapDocumentSignatureRow(data as DocumentSignatureRow);
}

export async function deleteDocumentSignature(
  documentType: 'quote' | 'invoice',
  documentId: string,
): Promise<void> {
  const { error } = await supabase
    .from('document_signatures')
    .delete()
    .eq('document_type', documentType)
    .eq('document_id', documentId);

  if (error) {
    logSupabaseError('deleteDocumentSignature', error);
    throw error;
  }
}
