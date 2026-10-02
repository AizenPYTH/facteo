'use client';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import { CheckMark, Segmented } from '@/components/app/document-composer/ui';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchProducts } from '@/lib/domain/supabase/products';
import { productsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { formatCurrency } from '@/lib/domain/format/currency';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

type CatalogTab = 'product' | 'service';

/**
 * Catalogue en panneau latéral droit (480 px) sur voile : onglets Prestations /
 * Produits, recherche, liste à cases, « Ajouter à la facture ».
 * Rendu dans l'éditeur, il en hérite les jetons `iq-*`.
 */
export function CatalogPicker({
  kind = 'invoice',
  open,
  onClose,
  onSelectMany,
}: {
  kind?: 'invoice' | 'quote';
  open: boolean;
  onClose: () => void;
  onSelectMany: (items: Product[]) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50" key="catalog">
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Fermer le catalogue"
            className="absolute inset-0 bg-iq-scrim"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            tabIndex={-1}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            type="button"
          />
          <motion.div
            animate={{ x: 0 }}
            aria-label="Catalogue"
            aria-modal="true"
            className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col border-l border-iq-line bg-iq-surface text-iq-ink shadow-[-24px_0_60px_-20px_var(--iq-shadow)]"
            exit={{ x: '100%' }}
            initial={reduceMotion ? false : { x: '100%' }}
            role="dialog"
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}>
            <CatalogPanelBody kind={kind} onClose={onClose} onSelectMany={onSelectMany} />
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/** Corps du panneau : monté à chaque ouverture, la sélection et la recherche repartent de zéro. */
function CatalogPanelBody({
  kind,
  onClose,
  onSelectMany,
}: {
  kind: 'invoice' | 'quote';
  onClose: () => void;
  onSelectMany: (items: Product[]) => void;
}) {
  const { user } = useAuth();
  const { scope } = useTenant();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<CatalogTab>('service');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const productsQuery = useQuery({
    queryKey: productsQueryKeys.list(user?.id ?? '', 'product', search),
    queryFn: () => fetchProducts(requireScope(scope), 'product', search),
    enabled: Boolean(scope?.companyId && user?.id),
  });

  const servicesQuery = useQuery({
    queryKey: productsQueryKeys.list(user?.id ?? '', 'service', search),
    queryFn: () => fetchProducts(requireScope(scope), 'service', search),
    enabled: Boolean(scope?.companyId && user?.id),
  });

  const items = useMemo(() => {
    const products = productsQuery.data ?? [];
    const services = servicesQuery.data ?? [];
    return tab === 'product' ? products : services;
  }, [productsQuery.data, servicesQuery.data, tab]);

  const loading = tab === 'product' ? productsQuery.isLoading : servicesQuery.isLoading;
  // La sélection survit au changement d'onglet : produits et prestations cochés
  // s'ajoutent ensemble.
  const selectedItems = [...(productsQuery.data ?? []), ...(servicesQuery.data ?? [])].filter(
    (item) => selectedIds.includes(item.id),
  );

  const tabLabel = (label: string, count: number | undefined) =>
    count === undefined ? label : `${label} · ${count}`;

  return (
    <>
      <div className="flex items-center px-[22px] pt-5">
        <h2 className="text-[19px] font-extrabold tracking-[-0.4px]">Catalogue</h2>
        <div className="flex-1" />
        <button
          aria-label="Fermer"
          className="flex size-[34px] items-center justify-center rounded-[9px] bg-iq-soft text-iq-ink2 transition-colors duration-150 hover:text-iq-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
          onClick={onClose}
          type="button">
          <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" viewBox="0 0 24 24" width="16">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <Segmented
        ariaLabel="Type d’élément"
        className="mx-[22px] mt-4"
        itemClassName="h-[34px] text-[13.5px]"
        onChange={setTab}
        options={[
          { value: 'service', label: tabLabel('Prestations', servicesQuery.data?.length) },
          { value: 'product', label: tabLabel('Produits', productsQuery.data?.length) },
        ]}
        value={tab}
      />

      <label className="mx-[22px] mb-1.5 mt-3 flex h-[42px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-iq-line px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-iq-accent focus-within:shadow-[0_0_0_3px_var(--iq-accent-soft)]">
        <svg aria-hidden className="shrink-0" fill="none" height="16" stroke="var(--iq-ink3)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4-4" />
        </svg>
        <input
          aria-label="Rechercher dans le catalogue"
          autoFocus
          className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-iq-ink outline-none"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher"
          type="search"
          value={search}
        />
      </label>

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-1.5">
        {loading ? (
          <p className="p-8 text-center text-[13.5px] text-iq-ink3">Chargement du catalogue…</p>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13.5px] text-iq-ink2">
              {search.trim()
                ? 'Aucun résultat.'
                : `${tab === 'product' ? 'Aucun produit' : 'Aucune prestation'} dans le catalogue.`}
            </p>
            <p className="mt-2 text-[12.5px] text-iq-ink3">
              Ajoutez des produits ou prestations depuis le menu Catalogue.
            </p>
          </div>
        ) : (
          <ul>
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const sub = [item.brand?.trim(), item.sku?.trim() ? `SKU ${item.sku.trim()}` : null]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={item.id}>
                  <button
                    aria-pressed={isSelected}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[12px] px-2.5 py-[11px] text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent',
                      isSelected ? 'bg-iq-accent-soft' : 'hover:bg-iq-soft',
                    )}
                    onClick={() =>
                      setSelectedIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((entry) => entry !== item.id)
                          : [...prev, item.id],
                      )
                    }
                    type="button">
                    <CheckMark checked={isSelected} className="size-5 rounded-[6px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{item.name}</span>
                      {sub ? (
                        <span className="mt-px block truncate text-[12.5px] text-iq-ink3">{sub}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[14px] font-bold">{formatCurrency(item.unitPrice)}</span>
                      <span className="block text-[12px] text-iq-ink3">
                        / {item.unit} · TVA {String(item.vatRate).replace('.', ',')} %
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-iq-line px-[22px] py-4">
        <p className="text-[13.5px] text-iq-ink2">
          <span className="font-extrabold text-iq-ink">{selectedItems.length}</span> sélectionné(s)
        </p>
        <div className="flex-1" />
        <button
          className="iq-shadow-primary h-[42px] rounded-[10px] bg-iq-accent px-[18px] text-[14px] font-bold text-white transition-[filter,opacity] duration-150 hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          disabled={selectedItems.length === 0}
          onClick={() => {
            onSelectMany(selectedItems);
            onClose();
          }}
          type="button">
          {kind === 'quote' ? 'Ajouter au devis' : 'Ajouter à la facture'}
        </button>
      </div>
    </>
  );
}
