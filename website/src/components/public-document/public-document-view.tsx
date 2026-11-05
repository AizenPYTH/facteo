'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { DocumentFrame } from '@/components/public-document/document-frame';
import { SignatureCanvas } from '@/components/public-document/signature-canvas';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format/currency';
import {
  parsePublicDocument,
  publicDocumentErrorMessage,
  type PublicDocument,
} from '@/lib/documents/public-document';
import { renderPdfInputToHtml } from '@/lib/pdf/document-pdf';
import { downloadPdfFromHtml } from '@/lib/pdf/pdf-export';

const STATUS_LABELS: Record<string, string> = {
  sent: 'En attente de votre réponse',
  accepted: 'Accepté',
  converted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
  paid: 'Payée',
  partially_paid: 'Partiellement payée',
  overdue: 'Échue',
  canceled: 'Annulée',
};

function formatDay(value: string | null): string {
  if (!value) return '';
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function formatMoment(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  }).format(new Date(value));
}

class PublicDocumentError extends Error {}

async function loadPublicDocument(token: string): Promise<{ document: PublicDocument; html: string }> {
  if (!/^[0-9a-f]{64}$/.test(token)) {
    throw new PublicDocumentError('Ce lien n’est pas valable ou a été désactivé.');
  }
  const { data, error } = await supabase.rpc('get_public_document', { p_token: token });
  if (error) {
    throw new PublicDocumentError(publicDocumentErrorMessage(error));
  }
  const parsed = parsePublicDocument(data);
  if (!parsed) {
    throw new PublicDocumentError('Ce document est introuvable.');
  }
  try {
    return { document: parsed, html: await renderPdfInputToHtml(parsed.pdfInput) };
  } catch {
    throw new PublicDocumentError('Impossible d’afficher le document. Réessayez dans un instant.');
  }
}

export function PublicDocumentView({ token }: { token: string }) {
  const query = useQuery({
    queryKey: ['public-document', token],
    queryFn: () => loadPublicDocument(token),
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (query.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm text-slate-500">Chargement du document…</p>
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Document indisponible</h1>
          <p className="mt-2 text-sm text-slate-600">
            {query.error instanceof PublicDocumentError
              ? query.error.message
              : 'Une erreur est survenue. Réessayez dans un instant.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <ReadyView
      document={query.data.document}
      html={query.data.html}
      token={token}
      onAnswered={async () => {
        await query.refetch();
      }}
    />
  );
}

function ReadyView({
  document: doc,
  html,
  token,
  onAnswered,
}: {
  document: PublicDocument;
  html: string;
  token: string;
  onAnswered: () => Promise<void>;
}) {
  const [downloading, setDownloading] = useState(false);
  const kindLabel = doc.type === 'quote' ? 'Devis' : 'Facture';
  const statusLabel = STATUS_LABELS[doc.status] ?? '';

  const download = async () => {
    setDownloading(true);
    try {
      await downloadPdfFromHtml(html, `${kindLabel}-${doc.number}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{doc.companyName}</p>
            <h1 className="truncate text-lg font-semibold text-slate-900">
              {kindLabel} n° {doc.number}
            </h1>
            <p className="text-sm text-slate-600">
              {formatCurrency(doc.totalTtc)} TTC
              {doc.type === 'quote' && doc.validUntil ? ` · valable jusqu’au ${formatDay(doc.validUntil)}` : ''}
              {doc.type === 'invoice' && doc.dueAt ? ` · échéance le ${formatDay(doc.dueAt)}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusLabel ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabel}</span>
            ) : null}
            <button
              type="button"
              onClick={() => void download()}
              disabled={downloading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {downloading ? 'Préparation…' : 'Télécharger le PDF'}
            </button>
            {doc.paymentLink && (doc.amountDue ?? 0) > 0 ? (
              <a
                href={doc.paymentLink}
                rel="noopener noreferrer"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Payer {formatCurrency(doc.amountDue ?? 0)}
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DocumentFrame html={html} title={`${kindLabel} ${doc.number}`} />
        </section>

        <aside className="space-y-4">
          {doc.type === 'quote' ? (
            <QuoteAnswerPanel doc={doc} token={token} onAnswered={onAnswered} />
          ) : (
            <InvoicePanel doc={doc} />
          )}
          <p className="px-1 text-xs text-slate-500">
            Ce lien vous est personnel. Ne le transférez qu’aux personnes autorisées à consulter ce document.
          </p>
        </aside>
      </div>
    </main>
  );
}

function InvoicePanel({ doc }: { doc: PublicDocument }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Votre facture</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Total TTC</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(doc.totalTtc)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Reste à payer</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(doc.amountDue ?? 0)}</dd>
        </div>
      </dl>
      {doc.status === 'paid' ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Cette facture est réglée. Merci !</p>
      ) : null}
      {doc.status === 'canceled' ? (
        <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">Cette facture a été annulée.</p>
      ) : null}
    </div>
  );
}

function QuoteAnswerPanel({
  doc,
  token,
  onAnswered,
}: {
  doc: PublicDocument;
  token: string;
  onAnswered: () => Promise<void>;
}) {
  const [mode, setMode] = useState<'accept' | 'reject'>('accept');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (doc.answer) {
    const accepted = doc.answer.decision === 'accepted';
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">{accepted ? 'Devis accepté' : 'Devis refusé'}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {accepted ? 'Signé' : 'Refusé'} par {doc.answer.signerName} le {formatMoment(doc.answer.createdAt)}.
        </p>
        {doc.answer.comment ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">« {doc.answer.comment} »</p>
        ) : null}
        <p className="mt-3 break-all text-[11px] leading-relaxed text-slate-400">
          Empreinte du devis (SHA-256) : {doc.answer.documentHash}
        </p>
      </div>
    );
  }

  if (!doc.canRespond) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          {doc.status === 'expired' ? 'Devis expiré' : 'Réponse déjà enregistrée'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {doc.status === 'expired'
            ? 'La date de validité de ce devis est dépassée. Contactez votre interlocuteur pour un devis à jour.'
            : 'Ce devis ne peut plus être signé en ligne.'}
        </p>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError('Indiquez votre nom et prénom.');
      return;
    }
    if (mode === 'accept' && !signature) {
      setError('Signez dans le cadre avant de valider.');
      return;
    }
    if (mode === 'accept' && !consent) {
      setError('Cochez la case « Bon pour accord » pour accepter le devis.');
      return;
    }
    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc('respond_to_public_quote', {
      p_token: token,
      p_decision: mode === 'accept' ? 'accepted' : 'rejected',
      p_signer_name: name,
      p_signer_email: email.trim() || null,
      p_signature: mode === 'accept' ? signature : null,
      p_comment: comment.trim() || null,
      p_consent: mode === 'accept' ? consent : false,
    });
    if (rpcError) {
      setSubmitting(false);
      setError(publicDocumentErrorMessage(rpcError));
      return;
    }
    await onAnswered();
    setSubmitting(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Votre réponse</h2>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode('accept')}
          className={`rounded-lg py-2 ${mode === 'accept' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={() => setMode('reject')}
          className={`rounded-lg py-2 ${mode === 'reject' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          Refuser
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Nom et prénom *</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">E-mail (facultatif)</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            maxLength={254}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">
            {mode === 'accept' ? 'Commentaire (facultatif)' : 'Motif du refus (facultatif)'}
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={2000}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500"
          />
        </label>

        {mode === 'accept' ? (
          <>
            <div>
              <span className="text-sm font-medium text-slate-700">Signature *</span>
              <div className="mt-1">
                <SignatureCanvas onChange={setSignature} disabled={submitting} />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1"
              />
              <span>
                <strong>Bon pour accord.</strong> J’ai pris connaissance du devis n° {doc.number} d’un montant de{' '}
                {formatCurrency(doc.totalTtc)} TTC et je l’accepte.
              </span>
            </label>
          </>
        ) : null}

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitting}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 ${
            mode === 'accept' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-900'
          }`}
        >
          {submitting ? 'Enregistrement…' : mode === 'accept' ? 'Signer et accepter le devis' : 'Refuser le devis'}
        </button>

        {mode === 'accept' ? (
          <p className="text-[11px] leading-relaxed text-slate-500">
            Signature électronique simple (article 1367 du Code civil). Sont enregistrés comme preuve : votre nom, votre
            signature, la date et l’heure, votre adresse IP, votre navigateur et une empreinte du devis signé.
          </p>
        ) : null}
      </div>
    </div>
  );
}
