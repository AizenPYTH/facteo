export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

import { DESKTOP_LAYOUT } from '@/constants/theme/desktop-tokens';

export const DESKTOP_SIDEBAR_WIDTH = DESKTOP_LAYOUT.sidebarWidth;
export const TABLET_SIDEBAR_WIDTH = DESKTOP_LAYOUT.sidebarCollapsedWidth;
/** Full-bleed desktop — no artificial max width */
export const DESKTOP_MAX_CONTENT_WIDTH = undefined as unknown as number;
