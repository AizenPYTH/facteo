/**
 * FACTEO Design System — single source for layout, motion, and component tokens.
 */
import { Platform } from 'react-native';

import { radius } from './radius';
import { spacing } from './spacing';
import { shadows } from './theme';
import { typography } from './typography';

export const layout = {
  screenPaddingHorizontal: spacing.screenPaddingHorizontal,
  sectionGap: spacing.sectionGap,
  cardRadius: radius.card,
  sheetRadius: radius.sheet,
  maxContentWidth: 560,
} as const;

export const motion = {
  fast: 200,
  normal: 320,
  slow: 480,
  spring: { damping: 18, stiffness: 180 },
} as const;

export const components = {
  buttonHeight: 48,
  inputHeight: 48,
  stickyFooterMinHeight: 56,
  actionTileIconSize: 44,
  workspaceAvatarSize: 48,
  templatePreviewHeight: 120,
} as const;

export const designSystem = {
  layout,
  motion,
  components,
  spacing,
  radius,
  shadows,
  typography,
  platform: Platform.OS,
} as const;

export type DesignSystem = typeof designSystem;
