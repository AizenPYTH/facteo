// Généré : familles intégrables dans les PDF et leur module.
import type { EmbeddedFont } from '@/lib/pdf/engine/templates/fonts/types';

export const EMBEDDED_FONT_LOADERS: Record<string, () => Promise<{ default: EmbeddedFont }>> = {
  'Plus Jakarta Sans': () => import('@/lib/pdf/engine/templates/fonts/jakarta'),
  'Archivo': () => import('@/lib/pdf/engine/templates/fonts/archivo'),
  'IBM Plex Sans': () => import('@/lib/pdf/engine/templates/fonts/plexSans'),
  'IBM Plex Mono': () => import('@/lib/pdf/engine/templates/fonts/plexMono'),
  'Manrope': () => import('@/lib/pdf/engine/templates/fonts/manrope'),
  'Space Grotesk': () => import('@/lib/pdf/engine/templates/fonts/grotesk'),
  'Source Serif 4': () => import('@/lib/pdf/engine/templates/fonts/sourceSerif'),
  'Libre Baskerville': () => import('@/lib/pdf/engine/templates/fonts/baskerville'),
  'Playfair Display': () => import('@/lib/pdf/engine/templates/fonts/playfair'),
  'DM Serif Display': () => import('@/lib/pdf/engine/templates/fonts/dmSerif'),
  'Space Mono': () => import('@/lib/pdf/engine/templates/fonts/spaceMono'),
  'Courier Prime': () => import('@/lib/pdf/engine/templates/fonts/courier'),
  'Oswald': () => import('@/lib/pdf/engine/templates/fonts/oswald'),
  'Caveat': () => import('@/lib/pdf/engine/templates/fonts/caveat'),
  'Lora': () => import('@/lib/pdf/engine/templates/fonts/lora'),
  'Fraunces': () => import('@/lib/pdf/engine/templates/fonts/fraunces'),
  'Syne': () => import('@/lib/pdf/engine/templates/fonts/syne'),
  'Bebas Neue': () => import('@/lib/pdf/engine/templates/fonts/bebas'),
  'Cormorant Garamond': () => import('@/lib/pdf/engine/templates/fonts/cormorant'),
  'Work Sans': () => import('@/lib/pdf/engine/templates/fonts/workSans'),
};
