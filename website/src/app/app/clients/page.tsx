'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { Mail, MapPin, Phone, Plus, User } from 'lucide-react';

import { MasterDetailLayout, WorkspaceToolbar } from '@/components/app/master-detail';
import { EmptyState, ErrorState } from '@/components/app/empty-state';
import { DetailSkeleton, TableSkeleton } from '@/components/app/skeleton';
import { AppSearchInput } from '@/components/app/app-shell';
import { Badge, LoadingState } from '@/components/app/ui';
import { useClientDetail } from '@/hooks/use-client-detail';
import { useInfiniteClients } from '@/hooks/use-clients';
import { getClientDisplayName, getClientSecondaryLabel } from '@/lib/domain/clients/name';
import { formatFrenchPhoneDisplay } from '@/lib/domain/format/phone';
import { cn } from '@/lib/utils';

function ClientsWorkspaceInner() {
  const [search, setSearch] = useState('');
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

  const client = detailQuery.data;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar subtitle={`${clients.length} client(s)`} title="Clients">
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition duration-150 hover:-translate-y-0.5 hover:bg-primary-dark"
          href="/app/clients/new">
          <Plus size={16} />
          Nouveau client
        </Link>
      </WorkspaceToolbar>

      <div className="min-h-0 flex-1">
        <MasterDetailLayout
          detail={
            detailQuery.isLoading && selectedId ? (
              <DetailSkeleton />
            ) : detailQuery.error ? (
              <div className="p-8">
                <ErrorState onRetry={() => void detailQuery.refetch()} />
              </div>
            ) : !client ? (
              <div className="flex h-full items-center justify-center p-8">
                <EmptyState
                  description="Choisissez un client dans la liste ou créez-en un nouveau."
                  title="Aucun client sélectionné"
                />
              </div>
            ) : (
              <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-6 sm:p-8">
                <div className="mx-auto max-w-3xl">
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-20px_rgba(15,23,42,0.2)] sm:p-8">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary ring-1 ring-blue-100">
                        <User size={26} strokeWidth={1.75} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                          {getClientDisplayName(client)}
                        </h2>
                        <p className="mt-1 text-slate-500">{getClientSecondaryLabel(client)}</p>
                        {client.company ? (
                          <Badge className="mt-3">{client.company}</Badge>
                        ) : null}
                      </div>
                    </div>

                    <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                      {client.email ? (
                        <div className="flex gap-3">
                          <Mail className="mt-0.5 text-slate-400" size={18} />
                          <div>
                            <dt className="text-xs text-slate-400">E-mail</dt>
                            <dd className="font-medium text-slate-800">{client.email}</dd>
                          </div>
                        </div>
                      ) : null}
                      {client.phone ? (
                        <div className="flex gap-3">
                          <Phone className="mt-0.5 text-slate-400" size={18} />
                          <div>
                            <dt className="text-xs text-slate-400">Téléphone</dt>
                            <dd className="font-medium text-slate-800">
                              {formatFrenchPhoneDisplay(client.phone)}
                            </dd>
                          </div>
                        </div>
                      ) : null}
                      {client.address || client.city ? (
                        <div className="flex gap-3 sm:col-span-2">
                          <MapPin className="mt-0.5 text-slate-400" size={18} />
                          <div>
                            <dt className="text-xs text-slate-400">Adresse</dt>
                            <dd className="font-medium text-slate-800">
                              {[client.address, client.postalCode, client.city, client.country]
                                .filter(Boolean)
                                .join(', ')}
                            </dd>
                          </div>
                        </div>
                      ) : null}
                    </dl>

                    {client.notes ? (
                      <div className="mt-8 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Notes
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">{client.notes}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: 'Devis', href: `/app/quotes?client=${client.id}` },
                      { label: 'Factures', href: `/app/invoices?client=${client.id}` },
                      { label: 'Modifier', href: `/app/clients/${client.id}/edit` },
                    ].map((action) => (
                      <Link
                        className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition duration-150 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-blue-50/40"
                        href={action.href}
                        key={action.label}>
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )
          }
          detailOpen={Boolean(selectedId)}
          detailTitle="Client"
          list={
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-slate-100/90 bg-gradient-to-b from-white to-slate-50/40 p-4">
                <AppSearchInput
                  onChange={setSearch}
                  placeholder="Rechercher un client…"
                  value={search}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {listQuery.isLoading ? (
                  <div className="p-4">
                    <TableSkeleton rows={8} />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="p-4">
                    <EmptyState title="Aucun client" />
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100/90">
                    {clients.map((c) => (
                      <li key={c.id}>
                        <button
                          className={cn(
                            'w-full px-4 py-3.5 text-left transition duration-150',
                            c.id === selectedId
                              ? 'border-l-[3px] border-primary bg-gradient-to-r from-blue-50/90 to-transparent pl-[13px]'
                              : 'border-l-[3px] border-transparent hover:bg-slate-50/90',
                          )}
                          onClick={() => setSelectedId(c.id)}
                          type="button">
                          <p className="text-[13px] font-semibold tracking-tight text-slate-900">
                            {getClientDisplayName(c)}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {getClientSecondaryLabel(c)}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          }
          onCloseDetail={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement des clients…" />}>
      <ClientsWorkspaceInner />
    </Suspense>
  );
}
