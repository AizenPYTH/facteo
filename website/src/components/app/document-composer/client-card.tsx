'use client';

import { Hash, MapPin } from 'lucide-react';

import { ClientPicker } from '@/components/app/client-picker';
import { ComposerCard } from '@/components/app/document-composer/composer-card';
import { InlineFieldError } from '@/components/app/document-composer/field-errors';
import { getClientDisplayName } from '@/lib/domain/clients/name';
import type { Client } from '@/types/client';

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

export function ComposerClientCard({
  clients,
  containerRef,
  errorMessage,
  hasError,
  loading,
  onChange,
  value,
}: {
  clients: Client[];
  containerRef?: React.Ref<HTMLElement>;
  errorMessage?: string;
  hasError?: boolean;
  loading?: boolean;
  onChange: (clientId: string) => void;
  value: string;
}) {
  const selected = clients.find((client) => client.id === value) ?? null;

  return (
    <ComposerCard
      action={<span className="text-[11px] font-semibold text-app-danger">Obligatoire</span>}
      containerRef={containerRef}
      title="Client">
      <ClientPicker
        clients={clients}
        error={hasError}
        loading={loading}
        onChange={onChange}
        value={value}
      />
      <InlineFieldError message={errorMessage} />

      {selected ? (
        <div className="mt-2.5 space-y-1.5 rounded-app-control border border-app-border-soft bg-app-subtle px-2.5 py-2">
          <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-app-muted">
            <MapPin className="mt-[2px] shrink-0 text-app-faint" size={13} strokeWidth={1.75} />
            <span>{composerClientAddress(selected)}</span>
          </p>
          <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-app-muted">
            <Hash className="mt-[2px] shrink-0 text-app-faint" size={13} strokeWidth={1.75} />
            <span>
              {selected.vatNumber?.trim()
                ? `TVA ${selected.vatNumber.trim()}`
                : 'Numéro de TVA non renseigné'}
            </span>
          </p>
        </div>
      ) : null}
    </ComposerCard>
  );
}
