/**
 * INVEQ Design System — single source for layout, motion, and component tokens.
 * Source: docs/design/DESIGN.md
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
  /** Sortie — DESIGN §3.7 */
  exit: 220,
  /** Entrée — DESIGN §3.7 */
  enter: 260,
  fast: 180,
  normal: 300,
  slow: 460,
  splash: 1000,
  listHighlight: 400,
  spring: { damping: 20, stiffness: 200 },
} as const;

export const components = {
  /** Primaire h 50–52 — DESIGN §3.1 */
  buttonHeight: 52,
  buttonHeightSecondary: 46,
  /** Champ autonome h 50 — DESIGN §3.3 */
  inputHeight: 50,
  /** Icône bouton / cible tactile min — DESIGN §3.1 / §8 */
  iconButtonSize: 44,
  touchTarget: 44,
  /** Avatar / icône de ligne — DESIGN §3.4 */
  listRowIconSize: 38,
  /** Liseré retard — DESIGN §3.4 */
  overdueAccentWidth: 3,
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
