'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AppDialog } from '@/components/app/app-dialog';
import { ClientForm } from '@/components/app/client-form';
import { IQ_PANEL, initialsOf } from '@/components/app/document-composer/ui';
import { getClientDisplayName } from '@/lib/domain/clients/name';
import { createClient } from '@/lib/domain/supabase/clients';
import { addCalendarDaysDateInput, frenchDateInputToIso } from '@/lib/domain/format/date-input';
import { clientsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { cn } from '@/lib/utils';
import { useTenant } from '@/providers/company-provider';
import type { Client, ClientFormValues } from '@/types/client';

export function composerClientLabel(client: Client): string {
  return getClientDisplayName(client) || client.lastName;
}

export function composerClientAddress(client: Client): string {
  const parts = [
    client.address?.trim(),
    [client.postalCode?.trim(), client.city?.trim()].filter(Boolean).join(' '),
    client.country?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Adresse non renseignée';
}

function clientContact(client: Client): string {
  const person = client.company ? `${client.firstName} ${client.lastName}`.trim() : '';
  return [person, client.email?.trim()].filter(Boolean).join(' · ');
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** « 2026-10-02 » → « vendredi 2 octobre 2026 » (calendrier UTC, comme le stockage). */
export function longDateLabel(value: string | null): string | null {
  const iso = value ? frenchDateInputToIso(value) : null;
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const PAYMENT_PRESETS = [0, 15, 30, 45, 60];

function paymentLabel(days: number): string {
  return days === 0 ? 'À réception' : `${days} jours`;
}

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    className={className}
    fill="none"
    height="17"
    stroke="currentColor"
    strokeLinecap="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="17">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4-4" />
  </svg>
);

/**
 * Carte unique « Client » + « Dates et paiement », en deux colonnes séparées
 * par un filet (une seule colonne sur écran étroit).
 */
export function ComposerClientDatesPanel({
  clientError,
  clientRef,
  clients,
  issuedAt,
  issuedAtError,
  kind,
  loading,
  onClientChange,
  onClientCreated,
  onIssuedAtChange,
  onPaymentTermsChange,
  paymentTermsDays,
  termsRef,
  value,
}: {
  clientError?: string;
  clientRef?: React.Ref<HTMLDivElement>;
  clients: Client[];
  issuedAt: string;
  issuedAtError?: string;
  kind: 'invoice' | 'quote';
  loading?: boolean;
  onClientChange: (clientId: string) => void;
  onClientCreated: (client: Client) => void;
  onIssuedAtChange: (value: string) => void;
  onPaymentTermsChange: (value: number | 'paid') => void;
  /** `null` : facture déjà payée. */
  paymentTermsDays: number | null;
  termsRef?: React.Ref<HTMLDivElement>;
  value: string;
}) {
  return (
    <section
      className={cn(
        IQ_PANEL,
        'grid grid-cols-1 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]',
      )}>
      <ClientColumn
        clients={clients}
        containerRef={clientRef}
        error={clientError}
        loading={loading}
        onChange={onClientChange}
        onCreated={onClientCreated}
        value={value}
      />
      <DatesColumn
        containerRef={termsRef}
        error={issuedAtError}
        issuedAt={issuedAt}
        kind={kind}
        onIssuedAtChange={onIssuedAtChange}
        onPaymentTermsChange={onPaymentTermsChange}
        paymentTermsDays={paymentTermsDays}
      />
    </section>
  );
}

function ClientColumn({
  clients,
  containerRef,
  error,
  loading,
  onChange,
  onCreated,
  value,
}: {
  clients: Client[];
  containerRef?: React.Ref<HTMLDivElement>;
  error?: string;
  loading?: boolean;
  onChange: (clientId: string) => void;
  onCreated: (client: Client) => void;
  value: string;
}) {
  const { scope } = useTenant();
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [createDraft, setCreateDraft] = useState<Partial<ClientFormValues> | null>(null);

  const selected = clients.find((client) => client.id === value) ?? null;

  const results = useMemo(() => {
    const wanted = normalize(query.trim());
    const digits = query.replace(/\D/g, '');
    if (!wanted) return clients;
    return clients.filter((client) => {
      const haystack = normalize(
        [composerClientLabel(client), client.city ?? '', client.email ?? ''].join(' '),
      );
      const ids = `${client.siren ?? ''} ${client.siret ?? ''}`.replace(/\s/g, '');
      return haystack.includes(wanted) || (digits.length >= 3 && ids.includes(digits));
    });
  }, [clients, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (values: ClientFormValues) => createClient(requireScope(scope), values),
    onSuccess: (client) => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
      onCreated(client);
      setCreateDraft(null);
    },
  });

  function openPicker() {
    setQuery('');
    setOpen(true);
  }

  function openCreate(company?: string) {
    setOpen(false);
    const trimmed = company?.trim() ?? '';
    const digits = trimmed.replace(/\s/g, '');
    setCreateDraft(
      /^\d{9}$/.test(digits)
        ? { siren: digits }
        : /^\d{14}$/.test(digits)
          ? { siret: digits }
          : trimmed
            ? { company: trimmed }
            : {},
    );
  }

  return (
    <div
      className="scroll-mt-24 border-b border-iq-line2 px-6 pb-6 pt-[22px] sm:border-b-0 sm:border-r"
      ref={containerRef}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Client</h2>
        <button
          className="flex items-center gap-1.5 rounded-[6px] text-[13px] font-bold text-iq-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
          onClick={() => openCreate()}
          type="button">
          <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" viewBox="0 0 24 24" width="15" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouveau client
        </button>
      </div>

      <div className="relative" ref={rootRef}>
      {selected ? (
        <>
          <button
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex w-full items-center gap-3 rounded-[12px] border border-iq-line bg-iq-surface px-3.5 py-3 text-left transition-colors duration-150 hover:border-iq-ink3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
            onClick={openPicker}
            type="button">
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-iq-accent-soft text-[13px] font-extrabold text-iq-accent-ink">
              {initialsOf(composerClientLabel(selected))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-bold">
                {composerClientLabel(selected)}
              </span>
              {clientContact(selected) ? (
                <span className="mt-px block text-[12.5px] leading-snug text-iq-ink3 [overflow-wrap:anywhere]">
                  {clientContact(selected)}
                </span>
              ) : null}
            </span>
            <svg aria-hidden fill="none" height="16" stroke="var(--iq-ink3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <dl className="mt-3.5 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-[5px] text-[13px] leading-normal">
            <dt className="text-iq-ink3">Adresse</dt>
            <dd className="text-iq-ink2">{composerClientAddress(selected)}</dd>
            <dt className="text-iq-ink3">TVA</dt>
            <dd className="text-iq-ink2">{selected.vatNumber?.trim() || 'Non renseignée'}</dd>
          </dl>
        </>
      ) : (
        <>
          <button
            aria-expanded={open}
            aria-haspopup="listbox"
            className={cn(
              'flex h-12 w-full items-center gap-2.5 rounded-[12px] border-[1.5px] bg-iq-surface px-3.5 text-left text-[14px] text-iq-ink3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent',
              error ? 'border-iq-danger' : 'border-iq-line hover:border-iq-ink3',
            )}
            onClick={openPicker}
            type="button">
            <SearchIcon />
            {loading ? 'Chargement des clients…' : 'Rechercher un client, un SIREN…'}
          </button>
          {error ? (
            <p className="mt-2 text-[12.5px] font-semibold text-iq-danger" role="alert">
              {error}
            </p>
          ) : (
            <p className="mt-2 text-[12.5px] text-iq-ink3">
              Saisissez un SIREN pour remplir la fiche automatiquement.
            </p>
          )}
        </>
      )}

      {open ? (
        <div className="iq-shadow-pop absolute -inset-x-2 top-0 z-20 overflow-hidden rounded-[14px] border border-iq-line bg-iq-surface">
          <div className="flex h-12 items-center gap-2.5 border-b border-iq-line2 px-3.5">
            <SearchIcon className="shrink-0 text-iq-accent" />
            <input
              aria-label="Rechercher un client"
              autoFocus
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-iq-ink outline-none"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && results[0]) {
                  event.preventDefault();
                  onChange(results[0].id);
                  setOpen(false);
                }
              }}
              placeholder="Nom, ville ou SIREN"
              value={query}
            />
            <span className="text-[11.5px] text-iq-ink3">Échap</span>
          </div>
          <ul className="max-h-[232px] overflow-y-auto p-1.5" role="listbox">
            {loading ? (
              <li className="px-2.5 py-3 text-[13px] text-iq-ink3">Chargement…</li>
            ) : results.length === 0 ? (
              <li className="px-2.5 py-3 text-[13px] text-iq-ink3">
                {clients.length === 0 ? 'Aucun client pour l’instant.' : 'Aucun résultat.'}
              </li>
            ) : (
              results.map((client) => {
                const active = client.id === value;
                const meta = [
                  client.city?.trim(),
                  client.siren?.trim() ? `SIREN ${client.siren.trim()}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={client.id}>
                    <button
                      aria-selected={active}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[10px] px-2.5 py-[9px] text-left transition-colors duration-150 hover:bg-iq-soft',
                        active && 'bg-iq-soft',
                      )}
                      onClick={() => {
                        onChange(client.id);
                        setOpen(false);
                      }}
                      role="option"
                      type="button">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-iq-soft text-[11.5px] font-extrabold text-iq-ink2">
                        {initialsOf(composerClientLabel(client))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-bold">
                          {composerClientLabel(client)}
                        </span>
                        {meta ? (
                          <span className="mt-px block truncate text-[12px] text-iq-ink3">{meta}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <button
            className="flex w-full items-center gap-2.5 border-t border-iq-line2 bg-iq-soft px-4 py-3 text-left text-[13.5px] font-bold text-iq-accent transition-colors duration-150 hover:bg-iq-accent-soft"
            onClick={() => openCreate(query)}
            type="button">
            <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" viewBox="0 0 24 24" width="16">
              <circle cx="10" cy="8" r="3.5" />
              <path d="M3.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6M19 8v6M16 11h6" />
            </svg>
            <span className="min-w-0 truncate">
              {query.trim() ? `Créer « ${query.trim()} » comme nouveau client` : 'Créer un nouveau client'}
            </span>
          </button>
        </div>
      ) : null}
      </div>

      <AppDialog
        description="Le nouveau client sera sélectionné automatiquement."
        onClose={() => {
          if (!createMutation.isPending) setCreateDraft(null);
        }}
        open={createDraft !== null}
        size="lg"
        title="Nouveau client">
        <div className="p-5">
          <ClientForm
            defaultValues={createDraft ?? undefined}
            onCancel={() => setCreateDraft(null)}
            onSubmit={async (values) => {
              await createMutation.mutateAsync(values);
            }}
            submitLabel="Créer le client"
          />
        </div>
      </AppDialog>
    </div>
  );
}

function DatesColumn({
  containerRef,
  error,
  issuedAt,
  kind,
  onIssuedAtChange,
  onPaymentTermsChange,
  paymentTermsDays,
}: {
  containerRef?: React.Ref<HTMLDivElement>;
  error?: string;
  issuedAt: string;
  kind: 'invoice' | 'quote';
  onIssuedAtChange: (value: string) => void;
  onPaymentTermsChange: (value: number | 'paid') => void;
  paymentTermsDays: number | null;
}) {
  const alreadyPaid = paymentTermsDays === null;
  const presets =
    paymentTermsDays !== null && !PAYMENT_PRESETS.includes(paymentTermsDays)
      ? [...PAYMENT_PRESETS, paymentTermsDays].sort((a, b) => a - b)
      : PAYMENT_PRESETS;
  const issuedIso = frenchDateInputToIso(issuedAt);
  // Le champ natif attend AAAA-MM-JJ ; la modification charge un JJ/MM/AAAA.
  const inputValue = issuedIso ? issuedIso.slice(0, 10) : '';
  const issuedLabel = longDateLabel(issuedAt);
  const dueLabel =
    paymentTermsDays === null
      ? null
      : longDateLabel(addCalendarDaysDateInput(issuedAt, paymentTermsDays));

  const options: { key: string; label: string; value: number | 'paid'; active: boolean }[] = [
    ...presets.map((days) => ({
      key: String(days),
      label: paymentLabel(days),
      value: days,
      active: days === paymentTermsDays,
    })),
    { key: 'paid', label: 'Déjà payée', value: 'paid', active: alreadyPaid },
  ];

  return (
    <div className="scroll-mt-24 px-6 pb-6 pt-[22px]" ref={containerRef}>
      <h2 className="mb-3 text-[15px] font-bold">Dates et paiement</h2>
      <div className="flex items-center gap-3">
        <label className="w-16 shrink-0 text-[13px] text-iq-ink3" htmlFor="composer-issued-at">
          Émission
        </label>
        <div
          className={cn(
            'relative flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border px-3 text-[14px] font-semibold transition-[border-color,box-shadow] duration-150 focus-within:border-iq-accent focus-within:shadow-[0_0_0_3px_var(--iq-accent-soft)]',
            error ? 'border-iq-danger' : 'border-iq-line hover:border-iq-ink3',
          )}>
          <svg aria-hidden className="shrink-0" fill="none" height="16" stroke="var(--iq-ink3)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
            <rect height="15" rx="2" width="16" x="4" y="5" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
          <span className="truncate">
            {issuedLabel ? capitalize(issuedLabel) : 'Choisir une date'}
          </span>
          {/* Champ natif invisible posé sur l'encadré : clavier, sélecteur et lecteurs d'écran. */}
          <input
            aria-invalid={Boolean(error)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            id="composer-issued-at"
            onChange={(event) => onIssuedAtChange(event.target.value)}
            onClick={(event) => {
              try {
                event.currentTarget.showPicker?.();
              } catch {
                // showPicker refuse parfois (iframe, geste non reconnu) : le focus suffit.
              }
            }}
            type="date"
            value={inputValue}
          />
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-[12.5px] font-semibold text-iq-danger" role="alert">
          {error}
        </p>
      ) : null}

      {kind === 'invoice' ? (
        <>
          <p className="mb-2 mt-4 text-[13px] text-iq-ink3" id="composer-payment-terms">
            Délai de paiement
          </p>
          <div aria-labelledby="composer-payment-terms" className="flex flex-wrap gap-1.5" role="group">
            {options.map((option) => (
              <button
                aria-pressed={option.active}
                className={cn(
                  'h-8 rounded-[9px] border px-3 text-[13px] font-semibold transition-[background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent',
                  option.active
                    ? 'border-iq-accent bg-iq-accent-soft text-iq-accent-ink'
                    : 'border-iq-line bg-iq-surface text-iq-ink2 hover:border-iq-ink3',
                )}
                key={option.key}
                onClick={() => onPaymentTermsChange(option.value)}
                type="button">
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-3.5 flex flex-wrap items-baseline gap-x-2 rounded-[10px] bg-iq-soft px-3 py-2.5 text-[13px]">
            <span className="text-iq-ink3">{alreadyPaid ? 'Payée le' : 'Échéance'}</span>
            <span className="font-bold">
              {(alreadyPaid ? issuedLabel : dueLabel) ?? '—'}
            </span>
          </p>
        </>
      ) : (
        <p className="mt-4 flex flex-wrap items-baseline gap-x-2 rounded-[10px] bg-iq-soft px-3 py-2.5 text-[13px]">
          <span className="text-iq-ink3">Valable jusqu’au</span>
          <span className="font-bold">Non définie</span>
        </p>
      )}
    </div>
  );
}
