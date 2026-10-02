/**
 * Texte dicté via Siri, en attente d'être appliqué à une nouvelle facture.
 * Rangé ici par `+native-intent` plutôt que transmis en paramètre de route :
 * un long texte dans l'URL (accents, « % », « & ») n'a plus à être décodé par
 * le routeur au démarrage de l'application.
 */
let pending: string | null = null;

export function setPendingDictation(text: string): void {
  const trimmed = text.trim();
  pending = trimmed ? trimmed.slice(0, 4000) : null;
}

/** Rend le texte une seule fois. */
export function takePendingDictation(): string | null {
  const value = pending;
  pending = null;
  return value;
}

/** Décode un composant d'URL sans jamais lever d'exception. */
export function safeDecode(value: string): string {
  const withSpaces = value.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(withSpaces);
  } catch {
    return withSpaces.replace(/%(?![0-9A-Fa-f]{2})/g, '%25').replace(/%[0-9A-Fa-f]{2}/g, (match) => {
      try {
        return decodeURIComponent(match);
      } catch {
        return match;
      }
    });
  }
}
