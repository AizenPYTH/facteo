'use client';

import { Suspense, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Check, Plus } from 'lucide-react';

import { AppDialog } from '@/components/app/app-dialog';
import { AppTopBar } from '@/components/app/app-shell';
import { EmptyState } from '@/components/app/empty-state';
import {
  PrimaryButton,
  SecondaryButton,
  SecondaryLink,
  TextInput,
} from '@/components/app/form-fields';
import { Badge, LoadingState } from '@/components/app/ui';
import { useCompany } from '@/providers/company-provider';
import type { CompanyMemberRole, TenantCompany } from '@/types/tenant';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<CompanyMemberRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
};

function companyInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '·'
  );
}

function CompanyCard({
  company,
  active,
  highlighted,
  switching,
  onActivate,
  onSelect,
}: {
  company: TenantCompany;
  active: boolean;
  highlighted: boolean;
  switching: boolean;
  onActivate: () => void;
  onSelect: () => void;
}) {
  const place = [company.city, company.country].filter(Boolean).join(', ');

  return (
    <article
      className={cn(
        'rounded-[14px] border bg-app-surface p-4',
        active ? 'border-app-accent-border' : highlighted ? 'border-app-accent/40' : 'border-app-border',
      )}>
      <button
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={onSelect}
        type="button">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-app-accent-violet to-app-accent text-[13px] font-bold text-white">
            {companyInitials(company.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-app-text">
              {company.name}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-app-muted-2">
              {ROLE_LABELS[company.role]}
              {place ? ` · ${place}` : ''}
            </p>
          </div>
        </div>
        {active ? <Badge variant="success">Actif</Badge> : null}
      </button>

      {(company.email || company.siret) ? (
        <dl className="mt-4 grid grid-cols-2 gap-2.5 border-t border-app-border-soft pt-3.5">
          <div>
            <dt className="text-[11px] text-app-faint">E-mail</dt>
            <dd className="mt-0.5 truncate text-[13px] font-medium text-app-text">
              {company.email || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-app-faint">SIRET</dt>
            <dd className="app-num mt-0.5 truncate text-[13px] font-medium text-app-text">
              {company.siret || '—'}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-3.5 flex gap-2">
        {active ? (
          <span className="flex flex-1 items-center justify-center rounded-app-field border border-app-success/20 bg-app-success-tint px-3 py-2 text-[12.5px] font-semibold text-app-success-text">
            <Check className="mr-1.5" size={14} />
            Espace actif
          </span>
        ) : (
          <PrimaryButton
            className="flex-1 py-2 text-[12.5px]"
            disabled={switching}
            onClick={onActivate}
            type="button">
            Activer
          </PrimaryButton>
        )}
        <SecondaryLink className="px-3 py-2 text-[12.5px]" href="/app/settings/company">
          Profil
        </SecondaryLink>
      </div>
    </article>
  );
}

function CompaniesWorkspaceInner() {
  const { companies, activeCompany, switchCompany, createNewCompany, loading, isSwitching } =
    useCompany();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('selected');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Indiquez un nom d’entreprise.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createNewCompany({ name: trimmed });
      setName('');
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer l’entreprise.');
    } finally {
      setSaving(false);
    }
  }

  function closeCreate() {
    if (saving) return;
    setCreateOpen(false);
    setError(null);
    setName('');
  }

  if (loading) {
    return <LoadingState message="Chargement des entreprises…" />;
  }

  return (
    <>
      <AppTopBar
        count={companies.length}
        subtitle="Chaque espace a ses clients, documents et numérotation"
        title="Entreprises">
        <PrimaryButton onClick={() => setCreateOpen(true)} type="button">
          <Plus size={16} />
          Nouvel espace
        </PrimaryButton>
      </AppTopBar>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        {companies.length === 0 ? (
          <EmptyState
            action={
              <PrimaryButton onClick={() => setCreateOpen(true)} type="button">
                <Plus size={15} />
                Créer un espace
              </PrimaryButton>
            }
            description="Créez un premier espace pour isoler clients, devis et factures."
            icon={Building2}
            title="Aucune entreprise"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
            {companies.map((company) => (
              <CompanyCard
                active={company.id === activeCompany?.id}
                company={company}
                highlighted={company.id === selectedId}
                key={company.id}
                onActivate={() => void switchCompany(company.id)}
                onSelect={() => setSelectedId(company.id)}
                switching={isSwitching}
              />
            ))}
          </div>
        )}
      </div>

      <AppDialog
        description="Ajoutez un nouvel espace de travail."
        footer={
          <>
            <SecondaryButton disabled={saving} onClick={closeCreate} type="button">
              Annuler
            </SecondaryButton>
            <PrimaryButton form="company-workspace-create" loading={saving} type="submit">
              Créer
            </PrimaryButton>
          </>
        }
        onClose={closeCreate}
        open={createOpen}
        size="sm"
        title="Nouvelle entreprise">
        <form
          className="space-y-4 px-[22px] pb-2"
          id="company-workspace-create"
          onSubmit={(event) => void handleCreate(event)}>
          <label className="block text-xs font-medium text-app-text-3" htmlFor="company-workspace-name">
            Nom de l’entreprise
          </label>
          <TextInput
            autoFocus
            id="company-workspace-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="ex. Atelier Nord"
            value={name}
          />
          {error ? <p className="text-[12px] font-medium text-app-danger">{error}</p> : null}
        </form>
      </AppDialog>
    </>
  );
}

export function CompaniesWorkspace() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CompaniesWorkspaceInner />
    </Suspense>
  );
}
