import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { A4_PRINT_OPTIONS } from '@/lib/pdf/a4';
import { presentNatively } from '@/lib/native/presentation';
import { ensurePdfFileUri, sanitizePdfFileName } from '@/lib/pdf/pdf-file';

/**
 * Pipeline de sortie d'un document : générer → ouvrir → partager → télécharger → imprimer.
 *
 * Règle de conception : **aucune action silencieuse**. Chaque opération renvoie
 * un `PdfOutcome` explicite, et l'appelant ne peut pas confondre « l'utilisateur
 * a annulé » avec « ça a marché » ou avec « ça a échoué ».
 */

export type GeneratedPdf = {
  /** Chemin du fichier PDF sur l'appareil. `null` sur le web : voir `html`. */
  uri: string | null;
  /** HTML source. Conservé pour le web (aperçu / impression navigateur). */
  html: string;
  fileName: string;
  numberOfPages: number;
};

export type PdfOutcome =
  | { status: 'done'; message?: string }
  | { status: 'cancelled' }
  | { status: 'unsupported'; message: string };

export class PdfGenerationError extends Error {
  constructor(message = 'Impossible de générer le PDF.') {
    super(message);
    this.name = 'PdfGenerationError';
  }
}

/** Le web ne produit pas de fichier PDF : `expo-print` y ouvre la boîte d'impression. */
export const canGeneratePdfFile = Platform.OS !== 'web';

/**
 * Verrou global par action.
 *
 * `expo-print` maintient son propre drapeau `isPrinting` et rejette avec
 * « Another print request is already in progress » : un double appui produisait
 * donc un message d'erreur alors que rien n'était cassé. On sérialise en amont.
 */
const inFlight = new Map<string, Promise<unknown>>();

export function runExclusive<T>(key: string, task: () => Promise<T>): Promise<T> | null {
  if (inFlight.has(key)) {
    return null;
  }

  const promise = task().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);

  return promise;
}

export function isPdfActionRunning(key: string): boolean {
  return inFlight.has(key);
}

/**
 * Vrai renoncement de l'utilisateur, à distinguer d'un échec technique.
 *
 * Le motif retenait auparavant « dismiss », ce qui attrapait aussi les erreurs
 * de présentation d'iOS — « ... while a presentation is in progress », « is
 * already presenting » — émises quand on ouvre une vue native alors qu'une
 * autre se ferme. Ces échecs passaient donc pour des annulations : l'action
 * ne se produisait pas, et rien n'était affiché.
 */
function isUserCancellation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (/already presenting|presentation is in progress|while presenting|another view controller/i.test(message)) {
    return false;
  }

  return /did not complete|cancell?ed|user cancel|dismissed by the user|abort/i.test(message);
}

function isConcurrentPrint(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');

  return /already in progress/i.test(message);
}

/* -------------------------------------------------------------------------- */
/* Génération                                                                  */
/* -------------------------------------------------------------------------- */

export async function generatePdfFromHtml(html: string, fileName: string): Promise<GeneratedPdf> {
  const safeName = sanitizePdfFileName(fileName);

  if (!html.trim()) {
    throw new PdfGenerationError('Le document est vide : vérifiez les informations de l’entreprise.');
  }

  if (!canGeneratePdfFile) {
    // Sur le web, `Print.printToFileAsync()` ne rend pas de fichier : il appelle
    // `window.print()` et renvoie `undefined`. On ne prétend donc pas produire
    // un PDF, on transporte le HTML jusqu'à l'aperçu et la boîte d'impression.
    return { uri: null, html, fileName: safeName, numberOfPages: 0 };
  }

  let result: Print.FilePrintResult;

  try {
    result = await Print.printToFileAsync({
      html,
      base64: false,
      width: A4_PRINT_OPTIONS.width,
      height: A4_PRINT_OPTIONS.height,
      margins: A4_PRINT_OPTIONS.margins,
    });
  } catch (error) {
    throw new PdfGenerationError(
      error instanceof Error ? error.message : 'Impossible de générer le PDF.',
    );
  }

  if (!result?.uri) {
    throw new PdfGenerationError();
  }

  const normalizedUri = await ensurePdfFileUri(result.uri, safeName);
  const info = await FileSystem.getInfoAsync(normalizedUri);

  // Un PDF « vide » (quelques octets) se produit quand la WebView n'a rien pu
  // rendre. Mieux vaut une erreur franche qu'un fichier illisible partagé.
  if (!info.exists || (info.size ?? 0) < 512) {
    throw new PdfGenerationError('Le PDF généré est vide. Réessayez.');
  }

  return {
    uri: normalizedUri,
    html,
    fileName: fileNameFromUri(normalizedUri, safeName),
    numberOfPages: result.numberOfPages ?? 1,
  };
}

function fileNameFromUri(uri: string, fallback: string): string {
  const segment = uri.split('/').pop();

  return segment && segment.toLowerCase().endsWith('.pdf') ? segment : fallback;
}

/** Le fichier existe-t-il toujours ? Le cache système peut avoir été vidé. */
export async function pdfFileStillExists(pdf: GeneratedPdf | null): Promise<boolean> {
  if (!pdf) {
    return false;
  }

  if (!pdf.uri) {
    return Boolean(pdf.html);
  }

  try {
    const info = await FileSystem.getInfoAsync(pdf.uri);
    return info.exists && (info.size ?? 0) >= 512;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Web : impression / enregistrement via le navigateur                          */
/* -------------------------------------------------------------------------- */

function printHtmlInBrowser(html: string): PdfOutcome {
  if (typeof document === 'undefined') {
    return { status: 'unsupported', message: 'Impression indisponible sur cette plateforme.' };
  }

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  // `onload` est posé AVANT l'insertion : l'événement de chargement du srcdoc
  // peut se déclencher dès l'insertion selon le navigateur.
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      // Laisser le temps à la boîte de dialogue de s'ouvrir avant de nettoyer.
      setTimeout(() => frame.remove(), 60_000);
    }
  };

  frame.srcdoc = html;
  document.body.appendChild(frame);

  return {
    status: 'done',
    message: 'Boîte d’impression ouverte : choisissez « Enregistrer au format PDF » pour télécharger.',
  };
}

/* -------------------------------------------------------------------------- */
/* Partage                                                                     */
/* -------------------------------------------------------------------------- */

export async function sharePdf(pdf: GeneratedPdf, dialogTitle: string): Promise<PdfOutcome> {
  if (!pdf.uri) {
    return printHtmlInBrowser(pdf.html);
  }

  if (!(await pdfFileStillExists(pdf))) {
    throw new PdfGenerationError('PDF introuvable sur l’appareil. Régénérez le document.');
  }

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    return {
      status: 'unsupported',
      message: 'Le partage n’est pas disponible sur cet appareil. Utilisez « Imprimer ».',
    };
  }

  try {
    await presentNatively(() =>
      Sharing.shareAsync(pdf.uri as string, {
        mimeType: 'application/pdf',
        dialogTitle,
        UTI: 'com.adobe.pdf',
      }),
    );
  } catch (error) {
    if (isUserCancellation(error)) {
      return { status: 'cancelled' };
    }

    throw error;
  }

  // iOS et Android ne signalent pas si l'utilisateur a réellement choisi une
  // destination : on annonce donc l'ouverture du menu, pas un envoi effectué.
  return { status: 'done' };
}

/* -------------------------------------------------------------------------- */
/* Téléchargement / enregistrement                                             */
/* -------------------------------------------------------------------------- */

/**
 * Enregistre réellement le PDF là où l'utilisateur le choisit.
 *
 * - Android : Storage Access Framework — le fichier est écrit dans le dossier
 *   sélectionné, c'est un vrai téléchargement.
 * - iOS : feuille de partage, qui contient « Enregistrer dans Fichiers ».
 * - Web : boîte d'impression du navigateur (« Enregistrer au format PDF »).
 */
export async function downloadPdf(pdf: GeneratedPdf): Promise<PdfOutcome> {
  if (!pdf.uri) {
    return printHtmlInBrowser(pdf.html);
  }

  if (!(await pdfFileStillExists(pdf))) {
    throw new PdfGenerationError('PDF introuvable sur l’appareil. Régénérez le document.');
  }

  if (Platform.OS === 'android') {
    const saved = await saveToAndroidFolder(pdf);

    if (saved) {
      return saved;
    }
    // Permission refusée ou SAF indisponible : on retombe sur le partage.
  }

  const shared = await sharePdf(pdf, `Enregistrer ${pdf.fileName}`);

  if (shared.status === 'done') {
    return {
      status: 'done',
      message:
        Platform.OS === 'ios'
          ? 'Choisissez « Enregistrer dans Fichiers » pour conserver le PDF.'
          : 'Choisissez une destination pour enregistrer le PDF.',
    };
  }

  return shared;
}

async function saveToAndroidFolder(pdf: GeneratedPdf): Promise<PdfOutcome | null> {
  const saf = FileSystem.StorageAccessFramework;

  if (!saf?.requestDirectoryPermissionsAsync) {
    return null;
  }

  let permissions: Awaited<ReturnType<typeof saf.requestDirectoryPermissionsAsync>>;

  try {
    permissions = await presentNatively(() => saf.requestDirectoryPermissionsAsync());
  } catch {
    return null;
  }

  if (!permissions.granted) {
    return { status: 'cancelled' };
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(pdf.uri as string, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const targetUri = await saf.createFileAsync(
      permissions.directoryUri,
      pdf.fileName.replace(/\.pdf$/i, ''),
      'application/pdf',
    );

    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { status: 'done', message: `${pdf.fileName} enregistré.` };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Impression                                                                  */
/* -------------------------------------------------------------------------- */

export async function printPdf(pdf: GeneratedPdf): Promise<PdfOutcome> {
  if (!pdf.uri) {
    return printHtmlInBrowser(pdf.html);
  }

  if (!(await pdfFileStillExists(pdf))) {
    throw new PdfGenerationError('PDF introuvable sur l’appareil. Régénérez le document.');
  }

  try {
    await presentNatively(() => Print.printAsync({ uri: pdf.uri as string }));
  } catch (error) {
    // iOS rejette la promesse quand la fenêtre d'impression est fermée sans
    // lancer l'impression : c'est une annulation, pas une panne.
    if (isUserCancellation(error)) {
      return { status: 'cancelled' };
    }

    if (isConcurrentPrint(error)) {
      return { status: 'cancelled' };
    }

    return {
      status: 'unsupported',
      message: 'Impression indisponible. Utilisez « Partager » pour ouvrir le PDF.',
    };
  }

  // Sur iOS la promesse ne se résout qu'une fois l'impression lancée ; sur
  // Android elle se résout dès l'ouverture de la fenêtre système. On annonce
  // donc l'envoi vers le système d'impression, jamais une impression terminée.
  return { status: 'done' };
}
