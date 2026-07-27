/**
 * INVEQ Design System — Design Language hub.
 *
 * Import from here (or @/constants/theme) when building UI.
 * Do not invent ad-hoc motion, shadows, or type sizes.
 */

import { Platform } from 'react-native';

import { componentLanguage } from './components';
import { interactionLanguage } from './interaction';
import { duration, motion, motionLanguage, spring } from './motion';
import { radius } from './radius';
import { spacing } from './spacing';
import { elevation, material, shadows, surface, surfaceLanguage } from './surfaces';
import { type, typographyLanguage } from './type-roles';
import { typography } from './typography';

export const layout = {
  screenPaddingHorizontal: spacing.screenPaddingHorizontal,
  sectionGap: spacing.sectionGap,
  cardRadius: radius.card,
  sheetRadius: radius.sheet,
  maxContentWidth: 560,
} as const;

/** @deprecated Prefer `componentLanguage` */
export const components = {
  buttonHeight: componentLanguage.button.height,
  inputHeight: componentLanguage.input.height,
  stickyFooterMinHeight: 56,
  actionTileIconSize: 44,
  workspaceAvatarSize: 48,
  templatePreviewHeight: 120,
} as const;

export const designSystem = {
  layout,
  motion,
  motionLanguage,
  duration,
  spring,
  surfaceLanguage,
  surface,
  elevation,
  material,
  shadows,
  typographyLanguage,
  type,
  interactionLanguage,
  componentLanguage,
  components,
  spacing,
  radius,
  typography,
  platform: Platform.OS,
} as const;

export type DesignSystem = typeof designSystem;

export {
  componentLanguage,
  duration,
  elevation,
  interactionLanguage,
  material,
  motion,
  motionLanguage,
  spring,
  surface,
  surfaceLanguage,
  type,
  typographyLanguage,
};
