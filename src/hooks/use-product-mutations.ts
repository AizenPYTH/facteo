import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { createProduct } from '@/lib/supabase/products';
import { productsQueryKeys } from '@/lib/supabase/query-keys';
import type { ProductFormValues } from '@/types/product';

export function useProductMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: (input: ProductFormValues) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to create a product.');
      }

      return createProduct(user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
    },
  });

  return {
    createProduct: createProductMutation,
  };
}
