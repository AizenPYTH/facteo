'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import {
  Building2,
  FileText,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  User,
  UserPlus,
} from 'lucide-react';
import type { Client } from '@inveq/types/client';

import { ActionMenu } from '@/components/app/action-menu';
import { AppSearchInput, AppTopBar } from '@/components/app/app-shell';
import { EmptyState, ErrorState, NoResultsState } from '@/components/app/empty-state';
import {
  PrimaryLink,
  SecondaryButton,
  SecondaryLink,
} from '@/components/app/form-fields';
import { MasterDetailLayout } from '@/components/app/master-detail';
import { DetailSkeleton, TableSkeleton } from '@/components/app/skeleton';
import { DataTable, LoadingState, type DataTableColumn } from '@/components/app/ui';
import { useClientDetail } from '@/hooks/use-client-detail';
import { useInfiniteClients } from '@/hooks/use-clients';
import { getClientDisplayName, getClientSecondaryLabel } from '@/lib/domain/clients/name';
import { formatDate } from '@/lib/domain/format/date';
import { formatFrenchPhoneDisplay } from '@/lib/domain/format/phone';
import { cn } from '@/lib/utils';

type ClientFilter = 'all' | 'company' | 'individual';

const CLIENT_FILTERS: { value: ClientFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'company', label: 'Professionnels' },
  { value: 'individual', label: 'Particuliers' },
];

function isCompanyClient(client: Client): boolean {
  return Boolean(client.company?.trim());
}

function clientTypeLabel(client: Client): string {
  return isCompanyClient(client) ? 'Professionnel' : 'Particulier';
}

function clientInitials(client: Client): string {
  const company = client.company?.trim();

  if (company) {
    return (
      company
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '·'
    );
  }

  return (
    [client.firstName, client.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '·'
  );
}

function ClientAvatar({ label, size }: { label: string; size: 'sm' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center bg-app-accent-tint font-bold text-app-accent',
        size === 'sm'
          ? 'h-[30px] w-[30px] rounded-app-field text-[11.5px]'
          : 'h-11 w-11 rounded-[12px] text-[15px]',
      )}>
      {label}
    </span>
  );
}

function ContactRow({
  icon: Icon,
  children,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="mt-[3px] shrink-0 text-app-faint" size={15} strokeWidth={1.75} />
      <span className="min-w-0 break-words text-[13px] text-app-text-2">{children}</span>
    </div>
  );
}

function ClientFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filter: ClientFilter;
  onFilterChange: (value: ClientFilter) => void;
  counts: Record<ClientFilter, number>;
}) {
  return (
    <>
      <div className="w-full min-w-[220px] flex-1 sm:max-w-[340px]">
        <AppSearchInput
          onChange={onSearchChange}
          placeholder="Nom, société, e-mail, ville…"
          value={search}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {CLIENT_FILTERS.map((item) => {
          const active = item.value === filter;

          return (
            <button
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-app-chip border px-[11px] py-[7px] text-[12.5px] font-semibold transition-colors duration-150',
                active
                  ? 'border-app-accent-border bg-app-accent-tint text-app-accent-strong'
                  : 'border-app-border bg-app-surface text-app-text-3 hover:border-app-accent-border',
              )}
              key={item.value}
              onClick={() => onFilterChange(item.value)}
              type="button">
              {item.label}
              <span
                className={cn(
                  'app-num text-[11px] font-semibold',
                  active ? 'text-app-accent' : 'text-app-faint',
                )}>
                {counts[item.value]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ClientDetailPanel({ client }: { client: Client }) {
  const person = getClientSecondaryLabel(client);
  const address = [client.address, client.postalCode, client.city, client.country]
    .filter(Boolean)
    .join(', ');
  const taxId = client.vatNumber || client.siret || client.siren;

  return (
    <div className="flex flex-col">
      <div className="border-b border-app-border-soft px-5 py-[18px]">
        <div className="flex items-center gap-3">
          <ClientAvatar label={clientInitials(client)} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-app-text">
              {getClientDisplayName(client)}
            </h2>
            <p className="mt-0.5 truncate text-[12.5px] text-app-muted">
              {person ? `${clientTypeLabel(client)} · ${person}` : clientTypeLabel(client)}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <PrimaryLink
            className="flex-1 py-2.5 text-[12.5px]"
            href={`/app/quotes?create=1&client=${client.id}`}>
            <FileText size={14} />
            Nouveau devis
          </PrimaryLink>
          <SecondaryLink
            className="flex-1 py-2.5 text-[12.5px]"
            href={`/app/invoices?create=1&client=${client.id}`}>
            <Receipt size={14} />
            Facturer
          </SecondaryLink>
          <SecondaryLink
            aria-label="Modifier le client"
            className="w-[38px] shrink-0 px-0 py-2.5"
            href={`/app/clients/${client.id}/edit`}
            title="Modifier le client">
            <Pencil size={15} />
          </SecondaryLink>
        </div>
      </div>

      <div className="border-b border-app-border-soft px-5 py-4">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">
          Coordonnées
        </p>
        {client.email ? (
          <ContactRow icon={Mail}>{client.email}</ContactRow>
        ) : null}
        {client.phone ? (
          <ContactRow icon={Phone}>{formatFrenchPhoneDisplay(client.phone)}</ContactRow>
        ) : null}
        {address ? <ContactRow icon={MapPin}>{address}</ContactRow> : null}
        {taxId ? <ContactRow icon={Hash}>{taxId}</ContactRow> : null}
        {!client.email && !client.phone && !address && !taxId ? (
          <p className="py-1.5 text-[13px] text-app-muted-2">Aucune coordonnée enregistrée.</p>
        ) : null}
      </div>

      {client.notes ? (
        <div className="border-b border-app-border-soft px-5 py-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">
            Notes
          </p>
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-app-text-2">
            {client.notes}
          </p>
        </div>
      ) : null}

      <div className="px-5 py-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">
          Fiche
        </p>
        <div className="flex items-center justify-between gap-3 py-[3px]">
          <span className="text-[13px] text-app-muted">Ajouté le</span>
          <span className="app-num text-[13px] font-medium text-app-text">
            {formatDate(client.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-[3px]">
          <span className="text-[13px] text-app-muted">Dernière modification</span>
          <span className="app-num text-[13px] font-medium text-app-text">
            {formatDate(client.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ClientsWorkspaceInner() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('all');
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('selected');

  const setSelectedId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set('selected', id);
      else params.delete('selected');
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '?', { scroll: false });
    },
    [router, searchParams],
  );

  const listQuery = useInfiniteClients(search);
  const detailQuery = useClientDetail(selectedId);

  const clients = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.clients) ?? [],
    [listQuery.data],
  );

  /** Les chips filtrent les seules données déjà chargées : aucune requête supplémentaire. */
  const counts = useMemo<Record<ClientFilter, number>>(() => {
    const companies = clients.filter(isCompanyClient).length;
    return {
      all: clients.length,
      company: companies,
      individual: clients.length - companies,
    };
  }, [clients]);

  const visibleClients = useMemo(
    () =>
      filter === 'all'
        ? clients
        : clients.filter((client) =>
            filter === 'company' ? isCompanyClient(client) : !isCompanyClient(client),
          ),
    [clients, filter],
  );

  const totalCount = listQuery.data?.pages[0]?.totalCount ?? null;
  const client = detailQuery.data;
  const isFiltered = search.trim().length > 0 || filter !== 'all';

  const columns: DataTableColumn[] = [
    { key: 'client', label: 'Client' },
    { key: 'contact', label: 'Contact' },
    { key: 'city', label: 'Ville' },
    { key: 'created', label: 'Ajouté le', className: 'max-lg:hidden' },
    { key: 'actions', label: '', className: 'w-[56px]' },
  ];

  const rows = visibleClients.map((entry) => ({
    id: entry.id,
    client: (
      <div className="flex items-center gap-2.5">
        <ClientAvatar label={clientInitials(entry)} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-app-text">{getClientDisplayName(entry)}</p>
          <p className="truncate text-[11.5px] text-app-muted-2">{clientTypeLabel(entry)}</p>
        </div>
      </div>
    ),
    contact: <span className="block truncate">{entry.email || '—'}</span>,
    city: <span className="block truncate text-app-muted">{entry.city || '—'}</span>,
    created: <span className="app-num text-app-muted">{formatDate(entry.createdAt)}</span>,
    actions: (
      <div className="flex items-center justify-end transition-opacity duration-150 max-lg:opacity-100 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        <ActionMenu
          items={[
            {
              key: 'open',
              label: 'Ouvrir la fiche',
              icon: User,
              onSelect: () => setSelectedId(entry.id),
            },
            {
              key: 'quote',
              label: 'Nouveau devis',
              icon: FileText,
              onSelect: () => router.push(`/app/quotes?create=1&client=${entry.id}`),
            },
            {
              key: 'invoice',
              label: 'Facturer',
              icon: Receipt,
              onSelect: () => router.push(`/app/invoices?create=1&client=${entry.id}`),
            },
            {
              key: 'edit',
              label: 'Modifier le client',
              icon: Pencil,
              onSelect: () => router.push(`/app/clients/${entry.id}/edit`),
            },
          ]}
        />
      </div>
    ),
  }));

  return (
    <>
      <AppTopBar
        count={
          totalCount !== null ? `${totalCount} ${totalCount > 1 ? 'clients' : 'client'}` : null
        }
        title="Clients"
        toolbar={
          <ClientFilterBar
            counts={counts}
            filter={filter}
            onFilterChange={setFilter}
            onSearchChange={setSearch}
            search={search}
          />
        }>
        <PrimaryLink href="/app/clients/new">
          <Plus size={16} />
          Nouveau client
        </PrimaryLink>
      </AppTopBar>

      <div className="min-h-0 flex-1">
        <MasterDetailLayout
          detail={
            detailQuery.isLoading && selectedId ? (
              <DetailSkeleton />
            ) : detailQuery.error ? (
              <div className="p-6">
                <ErrorState onRetry={() => void detailQuery.refetch()} />
              </div>
            ) : !client ? (
              <div className="p-5">
                <EmptyState
                  action={
                    <SecondaryButton onClick={() => setSelectedId(null)}>Fermer</SecondaryButton>
                  }
                  description="Ce client n’existe plus ou n’est pas accessible depuis cet espace."
                  icon={User}
                  title="Client introuvable"
                />
              </div>
            ) : (
              <ClientDetailPanel client={client} />
            )
          }
          detailOpen={Boolean(selectedId)}
          detailTitle="Client"
          list={
            listQuery.isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={8} />
              </div>
            ) : visibleClients.length === 0 ? (
              <div className="p-6">
                {isFiltered ? (
                  <NoResultsState
                    description="Aucun client ne correspond à cette recherche ou à ce filtre."
                    onClear={() => {
                      setSearch('');
                      setFilter('all');
                    }}
                    query={search}
                  />
                ) : (
                  <EmptyState
                    action={
                      <PrimaryLink href="/app/clients/new">
                        <UserPlus size={15} />
                        Ajouter un client
                      </PrimaryLink>
                    }
                    description="Ajoutez vos clients pour les retrouver en un clic dans vos devis et vos factures."
                    icon={Building2}
                    title="Aucun client pour le moment"
                  />
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col">
                <DataTable
                  activeRowId={selectedId}
                  className="min-h-0 flex-1 rounded-none border-0 max-[899px]:hidden"
                  columns={columns}
                  onRowClick={(row) => setSelectedId(String(row.id))}
                  rows={rows}
                />

                <ul className="min-h-0 flex-1 divide-y divide-app-border-soft overflow-y-auto min-[900px]:hidden">
                  {visibleClients.map((entry) => (
                    <li key={entry.id}>
                      <button
                        className={cn(
                          'flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
                          entry.id === selectedId ? 'bg-app-accent-soft' : 'hover:bg-app-hover',
                        )}
                        onClick={() => setSelectedId(entry.id)}
                        type="button">
                        <ClientAvatar label={clientInitials(entry)} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-app-text">
                            {getClientDisplayName(entry)}
                          </span>
                          <span className="block truncate text-[12px] text-app-muted-2">
                            {entry.city || entry.email || clientTypeLabel(entry)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-app-border-soft px-6 py-3.5">
                  <p className="app-num text-[12.5px] text-app-muted-2">
                    {totalCount !== null && filter === 'all'
                      ? `${visibleClients.length} sur ${totalCount} ${totalCount > 1 ? 'clients' : 'client'}`
                      : `${visibleClients.length} ${visibleClients.length > 1 ? 'clients' : 'client'}`}
                  </p>
                  {listQuery.hasNextPage ? (
                    <SecondaryButton
                      className="text-app-accent hover:border-app-accent-border hover:bg-app-accent-soft"
                      disabled={listQuery.isFetchingNextPage}
                      onClick={() => void listQuery.fetchNextPage()}>
                      {listQuery.isFetchingNextPage
                        ? 'Chargement…'
                        : totalCount !== null
                          ? `Charger ${Math.max(totalCount - clients.length, 0)} de plus`
                          : 'Charger plus'}
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>
            )
          }
          onCloseDetail={() => setSelectedId(null)}
        />
      </div>
    </>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement des clients…" />}>
      <ClientsWorkspaceInner />
    </Suspense>
  );
}
