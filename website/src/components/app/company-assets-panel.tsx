'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Panel } from '@/components/app/ui';
import { useCompanyAssetSrc } from '@/hooks/use-company-asset-src';
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
