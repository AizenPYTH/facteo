/**
 * INVEQ Typography Language — semantic roles only.
 */

import type { TextStyle } from 'react-native';

import { typography } from './typography';

function role(style: TextStyle, name: string): TextStyle & { role: string } {
  return { ...style, role: name };
}

/**
 * Pick by meaning — never by raw size.
 *
 * Scan order on a document card:
 * primaryNumber | cardTitle → secondary → badge → caption → micro
 */
export const type = {
  /** Screen-defining title (auth, rare moments). Max 1 / screen. */
  hero: role(typography.largeTitle, 'hero'),
  /** Screen or major section title */
  section: role(typography.title2, 'section'),
  /** Card primary line (client name, document number) */
  cardTitle: role(typography.headline, 'cardTitle'),
  /** KPI / money / counts */
  primaryNumber: role(typography.title2, 'primaryNumber'),
  /** Supporting line under a title */
  secondary: role(typography.subheadline, 'secondary'),
  /** Metadata: dates, ids */
  caption: role(typography.footnote, 'caption'),
  /** Status pills */
  badge: role({ ...typography.caption1, fontWeight: '600' }, 'badge'),
  /** Fine print */
  micro: role(typography.caption2, 'micro'),
  /** Default body */
  body: role(typography.body, 'body'),
  /** Form labels */
  label: role(typography.footnoteMedium, 'label'),
} as const;

export const typographyLanguage = {
  type,
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  rules: [
    'One hero max per screen.',
    'One primaryNumber emphasis per card.',
    'Prefer type.* roles over typography.* in new UI.',
  ],
} as const;

export type TypeRole = keyof typeof type;
