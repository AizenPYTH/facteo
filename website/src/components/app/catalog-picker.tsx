'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Package, Search, Square, Wrench, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchProducts } from '@/lib/domain/supabase/products';
import { productsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { formatCurrency } from '@/lib/domain/format/currency';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

type CatalogTab = 'product' | 'service';

export function CatalogPicker({
  open,
  onClose,
  onSelectMany,
}: {
  open: boolean;
  onClose: () => void;
  onSelectMany: (items: Product[]) => void;
}) {
  const { user } = useAuth();
  const { scope } = useTenant();
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<CatalogTab>('product');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const productsQuery = useQuery({
    queryKey: productsQueryKeys.list(user?.id ?? '', 'product', search),
    queryFn: () => fetchProducts(requireScope(scope), 'product', search),
    enabled: Boolean(open && scope?.companyId && user?.id),
  });

  const servicesQuery = useQuery({
    queryKey: productsQueryKeys.list(user?.id ?? '', 'service', search),
    queryFn: () => fetchProducts(requireScope(scope), 'service', search),
    enabled: Boolean(open && scope?.companyId && user?.id),
  });

  const items = useMemo(() => {
    const products = productsQuery.data ?? [];
    const services = servicesQuery.data ?? [];
    return tab === 'product' ? products : services;
  }, [productsQuery.data, servicesQuery.data, tab]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setSearch('');
    }
  }, [open]);

  const loading = productsQuery.isLoading || servicesQuery.isLoading;
  // La sélection survit au changement d'onglet : produits et prestations cochés
  // s'ajoutent ensemble.
  const selectedItems = [...(productsQuery.data ?? []), ...(servicesQuery.data ?? [])].filter((item) =>
    selectedIds.includes(item.id),
  );

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Fermer"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            type="button"
          />
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">Catalogue</h3>
            <p className="text-sm text-slate-500">Produits et prestations enregistrés</p>
          </div>
          <button
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            type="button">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              type="search"
              value={search}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: 'product', label: 'Produits', icon: Package, count: productsQuery.data?.length },
                { id: 'service', label: 'Prestations', icon: Wrench, count: servicesQuery.data?.length },
              ] as const
            ).map((option) => (
              <button
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition',
                  tab === option.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                )}
                key={option.id}
                onClick={() => setTab(option.id)}
                type="button">
                <option.icon size={15} />
                {option.label}
                {option.count !== undefined ? (
                  <span className="text-xs font-medium text-slate-400">{option.count}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Chargement du catalogue…</p>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                {tab === 'product' ? 'Aucun produit' : 'Aucune prestation'} dans le catalogue.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Ajoutez des produits ou prestations depuis le menu Catalogue.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => {
                const Icon = item.type === 'product' ? Package : Wrench;
                const isSelected = selectedIds.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-blue-50/60',
                        isSelected && 'bg-blue-50/80',
                      )}
                      onClick={() => {
                        setSelectedIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((entry) => entry !== item.id)
                            : [...prev, item.id],
                        );
                      }}
                      type="button">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(item.unitPrice)} HT · TVA {item.vatRate}% · {item.unit}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.brand || 'Sans marque'} · SKU {item.sku || '—'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-primary">
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">{selectedItems.length} sélectionné(s)</p>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition duration-150 hover:bg-primary-dark disabled:opacity-50"
            disabled={selectedItems.length === 0}
            onClick={() => {
              onSelectMany(selectedItems);
              onClose();
            }}
            type="button">
            Ajouter la sélection
          </button>
        </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
