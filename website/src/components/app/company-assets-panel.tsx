'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Panel } from '@/components/app/ui';
import { useCompanyAssetSrc } from '@/hooks/use-company-asset-src';
import { useSettings } from '@/hooks/use-settings';
import { settingsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { updateShowLogo } from '@/lib/domain/supabase/settings';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import { useSubscription } from '@/hooks/use-subscription';
import { uploadCompanyImageFile } from '@/lib/domain/supabase/companies';
import { useToast } from '@/providers/toast-provider';
import { toUserFacingError } from '@/lib/errors/messages';

type CompanyAssetsPanelProps = {
  companyId: string;
  logoUrl: string | null;
  signatureUrl: string | null;
  onUpdated: () => void;
};

export function CompanyAssetsPanel({
  companyId,
  logoUrl,
  signatureUrl,
  onUpdated,
}: CompanyAssetsPanelProps) {
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const [busy, setBusy] = useState<'logo' | 'signature' | null>(null);
  const logoLocked = !hasFeature('custom_logo');
  const { scope } = useTenant();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const showLogo = settings?.showLogo === true;
  const toggleLogo = useMutation({
    mutationFn: (value: boolean) => updateShowLogo(requireScope(scope), value),
    onSuccess: (_, value) => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.all });
      showSuccess(value ? 'Le logo apparaîtra sur vos factures et devis.' : 'Logo masqué sur vos documents.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });
  const signatureLocked = !hasFeature('company_signature');

  async function onFile(kind: 'logo' | 'signature', file: File | undefined) {
    if (!file) return;
    setBusy(kind);
    try {
      await uploadCompanyImageFile(companyId, kind, file);
      showSuccess(kind === 'logo' ? 'Logo mis à jour.' : 'Signature mise à jour.');
      onUpdated();
    } catch (error) {
      showError(
        toUserFacingError(error instanceof Error ? error.message : 'PREMIUM_FEATURE_REQUIRED'),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-4 space-y-4">
      <AssetCard
        busy={busy === 'logo'}
        description="Personnalise vos devis et factures. Disponible à partir de Basique."
        href="/app/settings/subscription"
        hint="PNG, JPG, WebP ou SVG, toutes tailles : marges rognées et taille ajustée automatiquement sur chaque modèle."
        imageUrl={logoUrl}
        label="Logo"
        locked={logoLocked}
        onFile={(file) => void onFile('logo', file)}
      />
      {!logoLocked ? (
        <label className="-mt-2 flex cursor-pointer items-start gap-3 rounded-[12px] border border-app-border bg-app-surface px-4 py-3">
          <input
            checked={showLogo}
            className="mt-0.5 h-4 w-4 shrink-0 [accent-color:var(--app-accent)]"
            disabled={toggleLogo.isPending || !settings}
            onChange={(event) => toggleLogo.mutate(event.target.checked)}
            type="checkbox"
          />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-app-text">
              Afficher le logo sur mes factures et devis
            </span>
            <span className="mt-0.5 block text-[12px] text-app-muted">
              {logoUrl
                ? 'Désactivé : vos documents restent sans logo. Réglage propre à cette entreprise.'
                : 'Ajoutez d’abord un logo ci-dessus.'}
            </span>
          </span>
        </label>
      ) : null}
      <AssetCard
        busy={busy === 'signature'}
        description="Signature de l’entreprise sur vos documents. Disponible à partir de Basique."
        href="/app/settings/subscription"
        hint="PNG, JPG ou WebP — max. 2 Mo"
        imageUrl={signatureUrl}
        label="Signature entreprise"
        locked={signatureLocked}
        onFile={(file) => void onFile('signature', file)}
      />
    </div>
  );
}

function AssetCard({
  label,
  description,
  hint,
  imageUrl,
  locked,
  busy,
  href,
  onFile,
}: {
  label: string;
  description: string;
  hint: string;
  imageUrl: string | null;
  locked: boolean;
  busy: boolean;
  href: string;
  onFile: (file: File | undefined) => void;
}) {
  const src = useCompanyAssetSrc(imageUrl);
  const isLogo = label === 'Logo';
  return (
    <Panel title={label}>
      {locked ? (
        <p className="text-[13px] text-app-text-2">
          {description}{' '}
          <Link className="font-semibold text-app-accent hover:underline" href={href}>
            Voir les offres
          </Link>
        </p>
      ) : (
        <label className="flex cursor-pointer items-center gap-4 rounded-[12px] border border-dashed border-app-border bg-app-canvas px-4 py-4">
          <div
            className={`flex h-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-app-surface p-1.5 ring-1 ring-app-border ${isLogo ? 'w-28' : 'w-14'}`}>
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={label} className="h-full w-full object-contain" src={src} />
            ) : imageUrl ? (
              <span className="text-[11px] text-app-muted">…</span>
            ) : (
              <span className="text-[11px] text-app-muted">Aucun</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-app-text">
              {busy ? 'Envoi…' : imageUrl ? 'Remplacer' : 'Ajouter'}
            </p>
            <p className="mt-0.5 text-[12px] text-app-muted">{hint}</p>
          </div>
          <input
            accept={isLogo ? 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif' : 'image/png,image/jpeg,image/webp'}
            className="sr-only"
            disabled={busy}
            onChange={(event) => onFile(event.target.files?.[0])}
            type="file"
          />
        </label>
      )}
    </Panel>
  );
}
