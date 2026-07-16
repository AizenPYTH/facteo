import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';

import { useBreakpoint } from '@/hooks/use-breakpoint';

/**
 * On tablet/desktop web, detail routes open inside list master-detail views.
 */
export function useDesktopListRedirect(listPath: string) {
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  useEffect(() => {
    if (!isWeb || (!isDesktop && !isTablet)) {
      return;
    }

    const rawId = params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return;
    }

    router.replace(`${listPath}?selected=${encodeURIComponent(id)}` as Href);
  }, [isDesktop, isTablet, isWeb, listPath, params.id]);
}
