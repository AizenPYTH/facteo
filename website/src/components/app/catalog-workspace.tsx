'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Package, Plus, Trash2, Wrench } from 'lucide-react';

import { MasterDetailLayout, WorkspaceToolbar } from '@/components/app/master-detail';
import { EmptyState } from '@/components/app/empty-state';
import { DetailSkeleton, TableSkeleton } from '@/components/app/skeleton';
import { AppSearchInput } from '@/components/app/app-shell';
import {
  FormActions,
  FormField,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
} from '@/components/app/form-fields';
import { Badge, LoadingState } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from '@/lib/domain/supabase/products';
import { requireScope } from '@/lib/domain/tenant/scope';
import { formatCurrency } from '@/lib/domain/format/currency';
import {
  createEmptyProductFormValues,
  mapProductToFormValues,
  type Product,
  type ProductFormValues,
  type ProductType,
} from '@/types/product';
import { cn } from '@/lib/utils';

import { productsQueryKeys } from '@/lib/domain/supabase/query-keys';

function ProductFormPanel({
  type,
  product,
  onClose,
  onSaved,
}: {
  type: ProductType;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { scope } = useTenant();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ProductFormValues>(
    product ? mapProductToFormValues(product) : createEmptyProductFormValues(),
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const activeScope = requireScope(scope);
      if (!values.name.trim()) throw new Error('Le nom est obligatoire.');
      if (product) {
        return updateProduct(activeScope, product.id, values);
      }
      return createProduct(activeScope, type, values);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      onSaved();
    },
    onError: (err: Error) => setError(err.message),
  });

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-xl space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {product ? 'Modifier' : 'Nouveau'} {type === 'product' ? 'produit' : 'prestation'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ces éléments peuvent être réutilisés dans vos devis et factures.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <FormField label="Nom *">
          <TextInput
            onChange={(e) => setField('name', e.target.value)}
            placeholder={type === 'product' ? 'Matériel, fourniture…' : 'Prestation, service…'}
            value={values.name}
          />
        </FormField>
        <FormField label="Description">
          <TextArea
            onChange={(e) => setField('description', e.target.value)}
            value={values.description}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Prix unitaire HT">
            <TextInput
              onChange={(e) => setField('unitPrice', e.target.value)}
              value={values.unitPrice}
            />
          </FormField>
          <FormField label="TVA (%)">
            <TextInput onChange={(e) => setField('vatRate', e.target.value)} value={values.vatRate} />
          </FormField>
          <FormField label="Unité">
            <TextInput onChange={(e) => setField('unit', e.target.value)} value={values.unit} />
          </FormField>
          <FormField label="Référence">
            <TextInput onChange={(e) => setField('reference', e.target.value)} value={values.reference} />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            checked={values.isActive}
            className="rounded border-slate-300"
            onChange={(e) => setField('isActive', e.target.checked)}
            type="checkbox"
          />
          Actif
        </label>

        <FormActions>
          <SecondaryButton onClick={onClose}>Annuler</SecondaryButton>
          <PrimaryButton loading={mutation.isPending} onClick={() => mutation.mutate()} type="button">
            Enregistrer
          </PrimaryButton>
        </FormActions>
      </div>
    </div>
  );
}

function CatalogWorkspaceInner({ type }: { type: ProductType }) {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('selected');
  const { user } = useAuth();
  const { scope } = useTenant();
  const queryClient = useQueryClient();

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

  const query = useQuery({
    queryKey: productsQueryKeys.list(user?.id ?? '', type, search),
    queryFn: () => fetchProducts(requireScope(scope), type, search),
    enabled: Boolean(scope?.companyId && user?.id),
  });

  const products = query.data ?? [];
  const selected = products.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId && products.length > 0 && mode === 'list') {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId, setSelectedId, mode]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(requireScope(scope), id),
    onSuccess: () => {
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
    },
  });

  const title = type === 'product' ? 'Produits' : 'Prestations';
  const Icon = type === 'product' ? Package : Wrench;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar subtitle={`${products.length} élément(s)`} title={title}>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark"
          onClick={() => {
            setSelectedId(null);
            setMode('form');
          }}
          type="button">
          <Plus size={16} />
          Ajouter
        </button>
      </WorkspaceToolbar>

      <div className="min-h-0 flex-1">
        <MasterDetailLayout
          detail={
            mode === 'form' ? (
              <ProductFormPanel
                onClose={() => setMode('list')}
                onSaved={() => setMode('list')}
                product={selected}
                type={type}
              />
            ) : query.isLoading ? (
              <DetailSkeleton />
            ) : !selected ? (
              <div className="flex h-full items-center justify-center p-8">
                <EmptyState
                  description={`Créez votre premier ${type === 'product' ? 'produit' : 'prestation'}.`}
                  title="Aucune sélection"
                />
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-8">
                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-2xl font-bold text-slate-900">{selected.name}</h2>
                        <Badge variant={selected.isActive ? 'success' : 'default'}>
                          {selected.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      {selected.reference ? (
                        <p className="mt-1 text-sm text-slate-500">Réf. {selected.reference}</p>
                      ) : null}
                    </div>
                  </div>

                  {selected.description ? (
                    <p className="mt-6 text-sm leading-relaxed text-slate-600">{selected.description}</p>
                  ) : null}

                  <dl className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <dt className="text-xs text-slate-400">Prix HT</dt>
                      <dd className="mt-1 text-lg font-bold text-slate-900">
                        {formatCurrency(selected.unitPrice)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <dt className="text-xs text-slate-400">TVA</dt>
                      <dd className="mt-1 text-lg font-bold text-slate-900">{selected.vatRate} %</dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <dt className="text-xs text-slate-400">Unité</dt>
                      <dd className="mt-1 text-lg font-bold text-slate-900">{selected.unit}</dd>
                    </div>
                  </dl>

                  <div className="mt-8 flex gap-3">
                    <button
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setMode('form')}
                      type="button">
                      Modifier
                    </button>
                    <button
                      className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm('Supprimer cet élément ?')) {
                          deleteMutation.mutate(selected.id);
                        }
                      }}
                      type="button">
                      <Trash2 className="mr-1 inline" size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )
          }
          list={
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-slate-100 p-4">
                <AppSearchInput
                  onChange={setSearch}
                  placeholder={`Rechercher…`}
                  value={search}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {query.isLoading ? (
                  <div className="p-4">
                    <TableSkeleton rows={8} />
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-4">
                    <EmptyState title={`Aucun ${type === 'product' ? 'produit' : 'prestation'}`} />
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <li key={product.id}>
                        <button
                          className={cn(
                            'w-full px-4 py-3.5 text-left transition',
                            product.id === selectedId ? 'bg-blue-50/80' : 'hover:bg-slate-50',
                          )}
                          onClick={() => {
                            setMode('list');
                            setSelectedId(product.id);
                          }}
                          type="button">
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatCurrency(product.unitPrice)} HT · TVA {product.vatRate}%
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}

export function CatalogWorkspace({ type }: { type: ProductType }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <CatalogWorkspaceInner type={type} />
    </Suspense>
  );
}
