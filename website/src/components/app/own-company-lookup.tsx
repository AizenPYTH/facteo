'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { TextInput } from '@/components/app/form-fields';
import { useCompanyRegistrationLookup } from '@/hooks/use-company-registration-lookup';
import {
  getCompanySearchErrorMessage,
  normalizeRegistrationDigits,
} from '@/lib/company-search';
import type { CompanyLookupResult } from '@/lib/company-search/types';
import { cn } from '@/lib/utils';

/**
 * SIREN ou SIRET de SA propre entreprise : l'entreprise est retrouvée et ses
 * informations remplies. Ouvert à toutes les offres et hors quota de
 * recherches, contrairement à la recherche de clients.
 */
export function OwnCompanyLookup({
  id,
  onChange,
  onFound,
  value,
}: {
  id?: string;
  onChange: (value: string) => void;
  onFound: (result: CompanyLookupResult) => void;
  value: string;
}) {
  const digits = normalizeRegistrationDigits(value);
  const siren = digits.length <= 9 ? digits : '';
  const siret = digits.length > 9 ? digits : '';
  const lookup = useCompanyRegistrationLookup(siren, siret, true, false);
  const appliedRef = useRef<string | null>(null);
  const onFoundRef = useRef(onFound);

  useEffect(() => {
    onFoundRef.current = onFound;
  }, [onFound]);

  useEffect(() => {
    if (!lookup.data || appliedRef.current === lookup.debouncedRegistrationNumber) return;
    appliedRef.current = lookup.debouncedRegistrationNumber;
    onFoundRef.current(lookup.data);
  }, [lookup.data, lookup.debouncedRegistrationNumber]);

  const loading = lookup.isFetching || (lookup.isTyping && digits.length >= 9);
  const message = loading
    ? 'Recherche de l’entreprise…'
    : lookup.isInvalidInput
      ? 'SIREN ou SIRET invalide.'
      : lookup.error
        ? getCompanySearchErrorMessage(lookup.error)
        : lookup.data && lookup.isLookupEnabled
          ? `Trouvée : ${lookup.data.companyName}`
          : 'Tapez le SIREN (9 chiffres) ou le SIRET (14 chiffres) : le reste se remplit tout seul.';
  const tone = lookup.error || lookup.isInvalidInput ? 'error' : lookup.data && !loading ? 'success' : 'muted';

  return (
    <div>
      <div className="relative">
        <TextInput
          className="app-num pr-9"
          id={id}
          inputMode="numeric"
          onChange={(event) => onChange(normalizeRegistrationDigits(event.target.value).slice(0, 14))}
          placeholder="SIREN ou SIRET"
          value={value}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="animate-spin text-app-muted" size={16} />
          ) : tone === 'success' ? (
            <CheckCircle2 className="text-app-success" size={16} />
          ) : null}
        </span>
      </div>
      <p
        className={cn(
          'mt-1.5 text-[11.5px] leading-relaxed',
          tone === 'error' ? 'text-app-danger-text' : tone === 'success' ? 'text-app-success' : 'text-app-muted-2',
        )}>
        {message}
      </p>
    </div>
  );
}
