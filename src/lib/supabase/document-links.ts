import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { PUBLIC_SITE_URL } from '@/lib/supabase/public-site-url';
import type { QuoteAcceptanceRow } from '@/types/database';

/**
 * Liens sécurisés vers un devis ou une facture (`<site>/d/<jeton>`), communs
 * au site et à l'application. Le client ouvre le lien sans compte : il voit
 * le document, le télécharge et, pour un devis, l'accepte (signature) ou le
 * refuse. Seule l'empreinte du jeton est stockée : un lien ne peut pas être
 * réaffiché, on en crée un nouveau.
 */

export type ShareableDocumentType = 'quote' | 'invoice';

export function publicDocumentUrl(token: string): string {
  return `${PUBLIC_SITE_URL}/d/${token}`;
}

/** Crée un lien (un brouillon partagé passe à « envoyé »). */
export async function createDocumentShareLink(
  documentType: ShareableDocumentType,
  documentId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_document_share_link', {
    p_document_type: documentType,
    p_document_id: documentId,
  });
  if (error || typeof data !== 'string') {
    logSupabaseError('createDocumentShareLink', error);
    if (error?.message?.includes('INVOICE_CANCELED')) {
      throw new Error('Une facture annulée ne peut pas être partagée.');
    }
    throw new Error('Impossible de créer le lien. Réessayez.');
  }
  return publicDocumentUrl(data);
}

/** Désactive tous les liens déjà envoyés pour ce document. */
export async function revokeDocumentShareLinks(
  documentType: ShareableDocumentType,
  documentId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc('revoke_document_share_links', {
    p_document_type: documentType,
    p_document_id: documentId,
  });
  if (error) {
    logSupabaseError('revokeDocumentShareLinks', error);
    throw new Error('Impossible de désactiver les liens. Réessayez.');
  }
  return typeof data === 'number' ? data : 0;
}

export type DocumentShareActivity = {
  activeLinks: number;
  totalViews: number;
  lastViewedAt: string | null;
};

/** Le client a-t-il ouvert le document ? */
export async function fetchDocumentShareActivity(
  documentType: ShareableDocumentType,
  documentId: string,
): Promise<DocumentShareActivity> {
  const { data, error } = await supabase
    .from('document_share_links')
    .select('revoked_at, expires_at, view_count, last_viewed_at')
    .eq('document_type', documentType)
    .eq('document_id', documentId);
  if (error) {
    logSupabaseError('fetchDocumentShareActivity', error);
    return { activeLinks: 0, totalViews: 0, lastViewedAt: null };
  }
  const now = Date.now();
  const rows = (data ?? []) as {
    revoked_at: string | null;
    expires_at: string;
    view_count: number;
    last_viewed_at: string | null;
  }[];
  return {
    activeLinks: rows.filter((row) => !row.revoked_at && new Date(row.expires_at).getTime() > now).length,
    totalViews: rows.reduce((sum, row) => sum + (row.view_count ?? 0), 0),
    lastViewedAt: rows.reduce<string | null>(
      (latest, row) => (row.last_viewed_at && (!latest || row.last_viewed_at > latest) ? row.last_viewed_at : latest),
      null,
    ),
  };
}

export type QuoteAcceptance = {
  id: string;
  decision: 'accepted' | 'rejected';
  signerName: string;
  signerEmail: string | null;
  signatureImage: string | null;
  comment: string | null;
  consentText: string | null;
  totalTtc: number;
  documentHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

/** Réponses du client à un devis (preuves conservées, jamais modifiées). */
export async function fetchQuoteAcceptances(quoteId: string): Promise<QuoteAcceptance[]> {
  const { data, error } = await supabase
    .from('quote_acceptances')
    .select(
      'id, decision, signer_name, signer_email, signature_image, comment, consent_text, total_ttc, document_hash, ip_address, user_agent, created_at',
    )
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false });
  if (error) {
    logSupabaseError('fetchQuoteAcceptances', error);
    return [];
  }
  return ((data ?? []) as Partial<QuoteAcceptanceRow>[]).map((row) => ({
    id: row.id ?? '',
    decision: row.decision === 'accepted' ? 'accepted' : 'rejected',
    signerName: row.signer_name ?? '',
    signerEmail: row.signer_email ?? null,
    signatureImage: row.signature_image ?? null,
    comment: row.comment ?? null,
    consentText: row.consent_text ?? null,
    totalTtc: Number(row.total_ttc ?? 0),
    documentHash: row.document_hash ?? '',
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    createdAt: row.created_at ?? '',
  }));
}
