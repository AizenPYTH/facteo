'use client';

import Link from 'next/link';

import type { ClientDuplicateMatch } from '@/lib/domain/clients/duplicates';
import { getClientDisplayName } from '@/lib/domain/clients/name';

export function ClientDuplicateSuggestions({
  matches,
  onConfirmCreate,
}: {
  matches: ClientDuplicateMatch[];
  onConfirmCreate: () => void;
}) {
  const top = matches[0];
  if (!top) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">Possible doublon détecté</p>
      <p className="mt-1 text-amber-900/90">
        {getClientDisplayName(top.client)} — {top.reasons.join(', ')}. Utilisez le client
        existant ou confirmez la création.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          className="inline-flex rounded-lg bg-amber-900 px-3 py-1.5 text-sm font-semibold text-white"
          href={`/app/clients?selected=${top.client.id}`}>
          Utiliser ce client
        </Link>
        <button
          className="inline-flex rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-950"
          onClick={onConfirmCreate}
          type="button">
          Créer quand même
        </button>
      </div>
      {matches.length > 1 ? (
        <p className="mt-2 text-xs text-amber-800/80">
          {matches.length - 1} autre(s) correspondance(s)
        </p>
      ) : null}
    </div>
  );
}
