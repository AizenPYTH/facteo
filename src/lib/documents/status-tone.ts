import type { BadgeTone } from '@/components/ui/badge';
import type { InvoiceStatus } from '@/types/invoice';
import type { QuoteStatus } from '@/types/quote';

/**
 * Correspondance statut → ton du `Badge`.
 *
 * Source unique : avant, chaque écran redéfinissait son propre couple
 * fond/texte, et « en retard » n'avait pas la même couleur en liste et en
 * détail. Les libellés restent dans `@/types/*`, les couleurs vivent ici.
 */
export const invoiceStatusTone: Record<InvoiceStatus, BadgeTone> = {
  draft: 'neutral',
  sent: 'primary',
  partially_paid: 'info',
  paid: 'success',
  overdue: 'warning',
  canceled: 'error',
};

export const quoteStatusTone: Record<QuoteStatus, BadgeTone> = {
  draft: 'neutral',
  sent: 'primary',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  converted: 'info',
};
