import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatBlogDate(isoDate: string): string {
  return format(new Date(isoDate), 'd MMMM yyyy', { locale: fr });
}
