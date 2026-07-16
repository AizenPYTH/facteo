import { useWindowDimensions, Platform } from 'react-native';

import { BREAKPOINTS } from '@/constants/theme/breakpoints';

export type BreakpointName = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  if (!isWeb) {
    return {
      width,
      height,
      isWeb: false,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      breakpoint: 'mobile' as BreakpointName,
    };
  }

  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;

  const breakpoint: BreakpointName = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';

  return {
    width,
    height,
    isWeb: true,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
  };
}
