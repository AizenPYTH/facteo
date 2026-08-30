import { useWindowDimensions, Platform } from 'react-native';

import { BREAKPOINTS } from '@/constants/theme/breakpoints';

export type BreakpointName = 'mobile' | 'tablet' | 'desktop';

const NATIVE_TABLET_MIN_WIDTH = 700;

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  if (!isWeb) {
    const isTablet = width >= NATIVE_TABLET_MIN_WIDTH;

    return {
      width,
      height,
      isWeb: false,
      isMobile: !isTablet,
      isTablet,
      isDesktop: false,
      breakpoint: (isTablet ? 'tablet' : 'mobile') as BreakpointName,
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
