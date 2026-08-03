'use client';

import { useMemo, useState } from 'react';

import {
  PrimaryButton,
  SecondaryButton,
  TextArea,
} from '@/components/app/form-fields';
import {
  CLIENT_AI_IMPORT_EXAMPLE,
  CLIENT_PLACEHOLDERS,
} from '@/constants/client-placeholders';
import { parseClientsWithAi } from '@/lib/domain/ai/parse-clients';
import {
  countLikelyClientBlocks,
  detectClientFields,
  type DetectedClientHints,
} from '@/lib/clients/detect-client-fields';
import { cn } from '@/lib/utils';
import type { ParsedClientDraft } from '@/types/ai-client';

export type ClientAiImportPanelProps = {
  onParsed: (clients: ParsedClientDraft[]) => void;
  onCancel?: () => void;
};

function clientPreviewLabel(client: ParsedClientDraft): string {
  const person = [client.firstName, client.lastName].filter(Boolean).join(' ').trim();
  return client.company || person || client.email || 'Client';
}

function buildHintChips(hints: DetectedClientHints, blockCount: number): string[] {
  const chips: string[] = [];
  if (blockCount > 0) {
    chips.push(blockCount === 1 ? '1 bloc' : `${blockCount} blocs`);
  }
  if (hints.emails.length > 0) {
    chips.push(`${hints.emails.length} e-mail${hints.emails.length > 1 ? 's' : ''}`);
  }
  if (hints.phones.length > 0) {
    chips.push(`${hints.phones.length} tél.`);
  }
  if (hints.vatNumbers.length > 0) {
    chips.push('TVA');
  }
  if (hints.websites.length > 0) {
    chips.push('Site');
  }
  if (hints.sirens.length > 0 || hints.sirets.length > 0) {
    chips.push('SIREN/SIRET');
  }
  if (hints.postalCodes.length > 0) {
    chips.push('CP');
  }
  if (hints.ibans.length > 0) {
    chips.push('IBAN');
  }
  return chips;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function ClientAiImportPanel({ onParsed, onCancel }: ClientAiImportPanelProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedClients, setParsedClients] = useState<ParsedClientDraft[] | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);

  const hints = useMemo(() => detectClientFields(text), [text]);
  const blockCount = useMemo(() => countLikelyClientBlocks(text), [text]);
  const chips = useMemo(() => buildHintChips(hints, blockCount), [hints, blockCount]);

  const ambiguities = useMemo(() => {
    if (!parsedClients) {
      return [];
    }
    return parsedClients.flatMap((client, index) =>
      client.ambiguities.map((item) => ({
        ...item,
        clientLabel: clientPreviewLabel(client),
        clientIndex: index,
      })),
    );
  }, [parsedClients]);

  function handleUseExample() {
    setText(CLIENT_AI_IMPORT_EXAMPLE);
    setFile(null);
    setParsedClients(null);
    setSelectedIndexes(new Set());
    setWarnings([]);
    setError(null);
  }

  async function handleAnalyze() {
    const trimmed = text.trim();
    if (!trimmed && !file) {
      setError('Collez un texte client ou choisissez un fichier.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setParsedClients(null);
    setSelectedIndexes(new Set());
    setWarnings([]);

    try {
      const payload = file
        ? {
            text: trimmed,
            fileName: file.name,
            fileBase64: await fileToBase64(file),
            mimeType: file.type || 'application/octet-stream',
          }
        : { text: trimmed };

      const result = await parseClientsWithAi(payload);
      const clients = result.clients;

      if (clients.length === 0) {
        setError('Aucun client détecté. Enrichissez le texte ou réessayez.');
        setWarnings(result.warnings);
        return;
      }

      setWarnings(result.warnings);
      setParsedClients(clients);

      if (clients.length === 1) {
        onParsed(clients);
        return;
      }

      setSelectedIndexes(new Set(clients.map((_, index) => index)));
    } catch (analyzeError) {
      const message =
        analyzeError instanceof Error && analyzeError.message.trim()
          ? analyzeError.message
          : 'Analyse IA indisponible. Réessayez dans quelques instants.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function toggleIndex(index: number) {
    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (!parsedClients) {
      return;
    }
    setSelectedIndexes(new Set(parsedClients.map((_, index) => index)));
  }

  function handleConfirmBatch() {
    if (!parsedClients) {
      return;
    }
    const selected = parsedClients.filter((_, index) => selectedIndexes.has(index));
    if (selected.length === 0) {
      setError('Sélectionnez au moins un client.');
      return;
    }
    onParsed(selected);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.1)]">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">Ajouter par IA</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Collez une carte de visite, une signature e-mail ou une fiche — on préremplit le
          formulaire.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-slate-700" htmlFor="client-ai-paste">
          Texte à analyser
        </label>
        <TextArea
          id="client-ai-paste"
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          placeholder={`Ex. ${CLIENT_PLACEHOLDERS.company}\n${CLIENT_PLACEHOLDERS.address}\n${CLIENT_PLACEHOLDERS.postalCode} ${CLIENT_PLACEHOLDERS.city}\n${CLIENT_PLACEHOLDERS.email}`}
          rows={8}
          value={text}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SecondaryButton onClick={handleUseExample} type="button">
          Utiliser un exemple
        </SecondaryButton>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
          {file ? file.name : 'Choisir un fichier'}
          <input
            accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.webp,text/plain,application/pdf"
            className="sr-only"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setFile(next);
              setError(null);
            }}
            type="file"
          />
        </label>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary"
              key={chip}>
              {chip}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Détection live dès que vous collez du texte.</p>
      )}

      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="space-y-1 text-xs text-slate-500">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <PrimaryButton
        disabled={isAnalyzing}
        onClick={() => {
          void handleAnalyze();
        }}
        type="button">
        {isAnalyzing ? 'Analyse…' : 'Analyser'}
      </PrimaryButton>

      {parsedClients && parsedClients.length > 1 ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-900">
            {parsedClients.length} clients détectés
          </p>
          <ul className="space-y-2">
            {parsedClients.map((client, index) => {
              const selected = selectedIndexes.has(index);
              return (
                <li key={`${clientPreviewLabel(client)}-${index}`}>
                  <button
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                      selected
                        ? 'border-primary/40 bg-blue-50/70'
                        : 'border-slate-200/90 bg-white hover:bg-slate-50',
                    )}
                    onClick={() => toggleIndex(index)}
                    type="button">
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-[11px] font-bold',
                        selected
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-300 bg-white text-transparent',
                      )}>
                      ✓
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {clientPreviewLabel(client)}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {[client.email, client.phone, client.city].filter(Boolean).join(' · ') ||
                          'À compléter'}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-3">
            <SecondaryButton onClick={handleSelectAll} type="button">
              Tout sélectionner
            </SecondaryButton>
            <PrimaryButton onClick={handleConfirmBatch} type="button">
              Confirmer ({selectedIndexes.size})
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      {parsedClients && parsedClients.length === 1 ? (
        <p className="text-sm text-slate-500">1 client détecté — formulaire prérempli.</p>
      ) : null}

      {ambiguities.length > 0 ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Points à vérifier</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800/90">
            {ambiguities.map((item, index) => (
              <li key={`${item.field}-${index}`}>
                {parsedClients && parsedClients.length > 1
                  ? `${item.clientLabel} — ${item.message}`
                  : item.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {onCancel ? (
        <SecondaryButton onClick={onCancel} type="button">
          Saisie manuelle
        </SecondaryButton>
      ) : null}
    </div>
  );
}
