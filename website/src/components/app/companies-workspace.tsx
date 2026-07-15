'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Check, Mail, MapPin, Phone } from 'lucide-react';

import { MasterDetailLayout, WorkspaceToolbar } from '@/components/app/master-detail';
import { EmptyState } from '@/components/app/empty-state';
import { Badge, LoadingState } from '@/components/app/ui';
import { useTenant } from '@/providers/company-provider';
import { cn } from '@/lib/utils';

function CompaniesWorkspaceInner() {
  const { companies, activeCompany, switchCompany, loading } = useTenant();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('selected') ?? activeCompany?.id ?? null;

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

  useEffect(() => {
    if (!selectedId && companies.length > 0) {
      setSelectedId(companies[0].id);
    }
  }, [companies, selectedId, setSelectedId]);

  const selected = companies.find((c) => c.id === selectedId) ?? null;

  if (loading) {
    return <LoadingState message="Chargement des entreprises…" />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar subtitle={`${companies.length} espace(s)`} title="Entreprises" />

      <div className="min-h-0 flex-1">
        <MasterDetailLayout
          detail={
            !selected ? (
              <div className="flex h-full items-center justify-center p-8">
                <EmptyState title="Aucune entreprise sélectionnée" />
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-8">
                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                      <Building2 size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selected.name}</h2>
                      <Badge className="mt-2" variant="info">
                        {selected.role === 'owner' ? 'Propriétaire' : selected.role}
                      </Badge>
                    </div>
                  </div>

                  <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                    {selected.email ? (
                      <div className="flex gap-3">
                        <Mail className="text-slate-400" size={18} />
                        <div>
                          <dt className="text-xs text-slate-400">E-mail</dt>
                          <dd className="font-medium text-slate-800">{selected.email}</dd>
                        </div>
                      </div>
                    ) : null}
                    {selected.phone ? (
                      <div className="flex gap-3">
                        <Phone className="text-slate-400" size={18} />
                        <div>
                          <dt className="text-xs text-slate-400">Téléphone</dt>
                          <dd className="font-medium text-slate-800">{selected.phone}</dd>
                        </div>
                      </div>
                    ) : null}
                    {selected.address || selected.city ? (
                      <div className="flex gap-3 sm:col-span-2">
                        <MapPin className="text-slate-400" size={18} />
                        <div>
                          <dt className="text-xs text-slate-400">Adresse</dt>
                          <dd className="font-medium text-slate-800">
                            {[selected.address, selected.postalCode, selected.city, selected.country]
                              .filter(Boolean)
                              .join(', ')}
                          </dd>
                        </div>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            )
          }
          list={
            <ul className="divide-y divide-slate-100 overflow-y-auto">
              {companies.map((company) => (
                <li key={company.id}>
                  <button
                    className={cn(
                      'w-full px-4 py-3.5 text-left transition',
                      company.id === selectedId ? 'bg-blue-50/80' : 'hover:bg-slate-50',
                    )}
                    onClick={() => setSelectedId(company.id)}
                    type="button">
                    <p className="font-semibold text-slate-900">{company.name}</p>
                    <p className="text-sm text-slate-500">{company.city ?? '—'}</p>
                  </button>
                </li>
              ))}
            </ul>
          }
          sidebar={
            selected ? (
              <div className="flex h-full flex-col p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </h3>
                <div className="mt-4 space-y-2">
                  {selected.id !== activeCompany?.id ? (
                    <button
                      className="flex w-full items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                      onClick={() => void switchCompany(selected.id)}
                      type="button">
                      <Check size={16} />
                      Activer cet espace
                    </button>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      Espace actif
                    </div>
                  )}
                  <a
                    className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    href="/app/settings/company">
                    Modifier le profil
                  </a>
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

export function CompaniesWorkspace() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CompaniesWorkspaceInner />
    </Suspense>
  );
}
