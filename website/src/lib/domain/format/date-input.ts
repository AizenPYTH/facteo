/** Convertit une date ISO en chaîne JJ/MM/AAAA pour les champs de formulaire. */
export function isoToFrenchDateInput(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/** Parse JJ/MM/AAAA ou AAAA-MM-JJ vers ISO (minuit UTC). Retourne null si invalide. */
export function frenchDateInputToIso(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      return null;
    }

    return date.toISOString();
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      return null;
    }

    return date.toISOString();
  }

  return null;
}

/** Aujourd’hui au format AAAA-MM-JJ (valeur d’un champ date). */
export function todayDateInput(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Libellé JJ/MM/AAAA, calendrier UTC de la date stockée (minuit UTC). */
export function frenchLabelFromDateInput(value: string): string | null {
  const iso = frenchDateInputToIso(value);

  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

/** Ajoute des jours calendaires. Retourne AAAA-MM-JJ, ou null si la date est invalide. */
export function addCalendarDaysDateInput(value: string, days: number): string | null {
  const iso = frenchDateInputToIso(value);

  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function todayFrenchDateInput(): string {
  return isoToFrenchDateInput(new Date().toISOString());
}

export function addDaysFrenchDateInput(days: number, from = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return isoToFrenchDateInput(date.toISOString());
}
