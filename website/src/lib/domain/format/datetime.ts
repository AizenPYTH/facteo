import { formatDate } from '@/lib/format/date';

export function formatDateTime(
  value: string | Date | null | undefined,
  locale = 'fr-FR',
): string {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTimeForPdf(value: string | Date | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const datePart = formatDate(date);
  const timePart = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${datePart} à ${timePart}`;
}
