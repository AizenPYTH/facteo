import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { catalogQueryKeys } from '@/lib/supabase/query-keys';
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type CreateProductInput,
  type UpdateProductInput,
} from '@/lib/supabase/products';

type CatalogItemInput = {
  name: string;
  description: string;
  unitPrice: number;
  vatRate: number;
  unit: string;
  reference: string;
};

/**
 * Création, édition et suppression d'un élément de catalogue.
 *
 * Le catalogue était en lecture seule : produits et prestations ne pouvaient
 * naître que d'un devis ou d'une facture, et rien ne permettait de corriger un
 * prix ou de retirer une référence obsolète.
 */
export function useCatalogMutations(type: 'product' | 'service') {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
  }

  const create = useMutation({
    mutationFn: (input: CatalogItemInput) => {
      const payload: CreateProductInput = { ...input, userId: user!.id, type };
      return createProduct(payload);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ productId, ...input }: CatalogItemInput & { productId: string }) => {
      const payload: UpdateProductInput = { ...input, productId, userId: user!.id };
      return updateProduct(payload);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (productId: string) => deleteProduct(user!.id, productId),
    onSuccess: invalidate,
  });

  return { create, update, remove, canMutate: Boolean(user?.id) };
}
