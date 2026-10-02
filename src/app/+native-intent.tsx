import { safeDecode, setPendingDictation } from '@/lib/ai/pending-dictation';

/**
 * Liens entrants. Le raccourci Siri « Facture INVEQ » ouvre
 * `inveq://invoices/new?dictation=<texte>` : le texte est mis de côté, et
 * l'application s'ouvre sur `/invoices/new?voice=1`, sans texte dans l'URL.
 * Toute erreur laisse passer le lien tel quel au lieu de faire tomber l'app.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const queryStart = path.indexOf('?');
    if (queryStart < 0 || !/invoices\/new/.test(path)) {
      return path;
    }
    const entry = path
      .slice(queryStart + 1)
      .split('&')
      .find((part) => part.startsWith('dictation='));
    if (!entry) {
      return path;
    }
    setPendingDictation(safeDecode(entry.slice('dictation='.length)));
    return '/invoices/new?voice=1';
  } catch {
    return path;
  }
}
