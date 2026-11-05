'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Link2, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';

import { GhostButton, SecondaryButton } from '@/components/app/form-fields';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDateTime } from '@/lib/domain/format/datetime';
import {
  createDocumentShareLink,
  fetchDocumentShareActivity,
  fetchQuoteAcceptances,
  revokeDocumentShareLinks,
  type ShareableDocumentType,
} from '@/lib/domain/supabase/document-links';
import { invoicesQueryKeys, quotesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { useToast } from '@/providers/toast-provider';

/**
 * Lien sécurisé à transmettre au client (consultation, téléchargement et,
 * pour un devis, signature en ligne) + preuve de la réponse du client.
 */
export function ClientLinkPanel({
  documentType,
  documentId,
  status,
}: {
  documentType: ShareableDocumentType;
  documentId: string;
  status: string;
}) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activityQuery = useQuery({
    queryKey: ['document-share-activity', documentType, documentId],
    queryFn: () => fetchDocumentShareActivity(documentType, documentId),
  });

  const acceptancesQuery = useQuery({
    queryKey: ['quote-acceptances', documentId],
    queryFn: () => fetchQuoteAcceptances(documentId),
    enabled: documentType === 'quote',
  });

  const refreshDocument = () => {
    void queryClient.invalidateQueries({ queryKey: ['document-share-activity', documentType, documentId] });
    void queryClient.invalidateQueries({
      queryKey: documentType === 'quote' ? quotesQueryKeys.all : invoicesQueryKeys.all,
    });
  };

  const createMutation = useMutation({
    mutationFn: () => createDocumentShareLink(documentType, documentId),
    onSuccess: async (link) => {
      setUrl(link);
      refreshDocument();
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        showSuccess('Lien copié. Collez-le dans votre message au client.');
      } catch {
        showSuccess('Lien créé.');
      }
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Impossible de créer le lien.'),
  });

  const revokeMutation = useMutation({
    mutationFn: () => revokeDocumentShareLinks(documentType, documentId),
    onSuccess: (count) => {
      setUrl(null);
      refreshDocument();
      showSuccess(count > 0 ? 'Les liens envoyés ne fonctionnent plus.' : 'Aucun lien actif.');
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Échec.'),
  });

  const canShare = !(documentType === 'invoice' && status === 'canceled');
  const activity = activityQuery.data;
  const answer = acceptancesQuery.data?.[0] ?? null;

  return (
    <div className="border-b border-app-border-soft px-5 py-4">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">
        {documentType === 'quote' ? 'Signature en ligne' : 'Lien client'}
      </p>

      {answer ? <AnswerProof answer={answer} /> : null}

      {documentType === 'quote' && !answer && status === 'accepted' ? (
        <p className="mb-3 rounded-app-control bg-app-hover px-3 py-2 text-[12.5px] text-app-text-3">
          Accepté manuellement : aucune signature en ligne n’est enregistrée pour ce devis.
        </p>
      ) : null}

      {canShare ? (
        <>
          <p className="text-[12.5px] text-app-muted">
            {documentType === 'quote'
              ? 'Votre client consulte le devis, le télécharge, puis l’accepte en signant (téléphone ou ordinateur) ou le refuse.'
              : 'Votre client consulte la facture, la télécharge et la règle en ligne si un lien de paiement existe.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SecondaryButton disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
              {copied ? <Check size={15} /> : <Link2 size={15} />}
              {createMutation.isPending ? 'Création…' : url ? 'Nouveau lien' : 'Copier le lien client'}
            </SecondaryButton>
            {activity && activity.activeLinks > 0 ? (
              <GhostButton disabled={revokeMutation.isPending} onClick={() => revokeMutation.mutate()}>
                <XCircle size={15} />
                Désactiver les liens
              </GhostButton>
            ) : null}
          </div>
          {url ? (
            <div className="mt-2 flex items-center gap-2 rounded-app-control border border-app-border bg-app-hover px-2.5 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-app-text-3">{url}</span>
              <button
                aria-label="Copier le lien"
                className="text-app-muted hover:text-app-text"
                onClick={() => {
                  void navigator.clipboard.writeText(url).then(() => setCopied(true));
                }}
                type="button">
                <Copy size={14} />
              </button>
            </div>
          ) : null}
          {activity ? (
            <p className="mt-2 text-[12px] text-app-faint">
              {activity.lastViewedAt
                ? `Ouvert ${activity.totalViews} fois · dernière fois le ${formatDateTime(activity.lastViewedAt)}`
                : activity.activeLinks > 0
                  ? 'Pas encore ouvert par le client.'
                  : 'Aucun lien envoyé.'}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-[12.5px] text-app-muted">
          Une facture annulée ne peut pas être partagée.
        </p>
      )}
    </div>
  );
}

function AnswerProof({
  answer,
}: {
  answer: NonNullable<Awaited<ReturnType<typeof fetchQuoteAcceptances>>[number]>;
}) {
  const accepted = answer.decision === 'accepted';
  return (
    <div
      className={`mb-3 rounded-app-control border px-3 py-3 text-[12.5px] ${
        accepted ? 'border-emerald-200 bg-emerald-50/60' : 'border-app-border bg-app-hover'
      }`}>
      <p className="flex items-center gap-1.5 font-semibold text-app-text">
        <ShieldCheck size={15} />
        {accepted ? 'Signé en ligne' : 'Refusé en ligne'} par {answer.signerName}
      </p>
      <p className="mt-1 text-app-text-3">
        Le {formatDateTime(answer.createdAt)} · {formatCurrency(answer.totalTtc)} TTC
      </p>
      {answer.comment ? <p className="mt-2 text-app-text-3">« {answer.comment} »</p> : null}
      {answer.signatureImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`Signature de ${answer.signerName}`}
          className="mt-2 h-16 rounded border border-app-border bg-white object-contain p-1"
          src={answer.signatureImage}
        />
      ) : null}
      <details className="mt-2 text-[11.5px] text-app-faint">
        <summary className="cursor-pointer">Preuve du consentement</summary>
        <dl className="mt-1.5 space-y-1 break-all">
          {answer.consentText ? <div>Texte accepté : {answer.consentText}</div> : null}
          {answer.signerEmail ? <div>E-mail : {answer.signerEmail}</div> : null}
          <div>Adresse IP : {answer.ipAddress ?? 'non transmise'}</div>
          <div>Navigateur : {answer.userAgent ?? 'non transmis'}</div>
          <div>Empreinte SHA-256 du devis signé : {answer.documentHash}</div>
          <div>Signature électronique simple (art. 1367 du Code civil), non qualifiée.</div>
        </dl>
      </details>
    </div>
  );
}
