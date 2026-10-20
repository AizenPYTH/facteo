import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useTenant } from '@/hooks/use-tenant';
import { addDocumentLinesToCatalog } from '@/lib/catalog/auto-add';
import { catalogQueryKeys } from '@/lib/supabase/query-keys';
import { useToast } from '@/providers/toast-provider';

type CatalogLine = Parameters<typeof addDocumentLinesToCatalog>[1][number];

/**
 * Après la création d'une facture ou d'un devis : les articles saisis à la
 * main rejoignent le catalogue pour les prochaines fois (comme sur le site).
 * Sans attente ni erreur visible : la création n'en dépend jamais.
 */
export function useAddLinesToCatalog() {
  const { scope } = useTenant();
  const queryClient = useQueryClient();
  const { showInfo } = useToast();

  return useCallback(
    (lines: CatalogLine[]) => {
      if (!scope) return;
      void addDocumentLinesToCatalog(scope, lines)
        .then((added) => {
          if (added === 0) return;
          void queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
          showInfo(
            added > 1 ? `${added} nouveaux articles ajoutés au catalogue.` : 'Nouvel article ajouté au catalogue.',
          );
        })
        .catch(() => undefined);
    },
    [queryClient, scope, showInfo],
  );
}
