import createQrCode from 'qrcode-generator';

/**
 * Rendu d'un QR code en SVG **inline** (pas d'`<img>`, pas de data-URI, pas de JS).
 *
 * Pourquoi inline : l'aperçu et le PDF sont produits par une WebView
 * (`expo-print`). Toute ressource externe — image distante, data-URI volumineux,
 * script — peut ne pas être chargée au moment où la page est capturée, ce qui
 * donne un emplacement vide. Un `<svg>` inline est rendu avec le document.
 */

export type QrSvgOptions = {
  /** Taille du carré en pixels CSS. */
  size?: number;
  /** Marge (quiet zone) exprimée en modules. Le standard QR impose 4. */
  quietZone?: number;
  darkColor?: string;
  lightColor?: string;
  title?: string;
};

const DEFAULT_OPTIONS: Required<Omit<QrSvgOptions, 'title'>> = {
  size: 96,
  quietZone: 4,
  darkColor: '#000000',
  lightColor: '#FFFFFF',
};

/**
 * Encodeur UTF-8 fourni par nous, et non par la librairie.
 *
 * `qrcode-generator` expose deux builds : le build CJS enregistre un encodeur
 * UTF-8 optionnel, le build ESM (celui que résolvent Metro et esbuild) n'en
 * expose aucun et se rabat sur `charCodeAt(i) & 0xff`. Les caractères accentués
 * — donc la plupart des raisons sociales françaises — seraient encodés en
 * Latin-1 alors que le payload EPC se déclare en UTF-8, et l'application
 * bancaire afficherait des caractères erronés. On impose donc l'encodage.
 */
function stringToUtf8Bytes(value: string): number[] {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    let codePoint = value.charCodeAt(index);

    // Paire de substitution (emoji, caractères hors BMP).
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < value.length) {
      const low = value.charCodeAt(index + 1);

      if (low >= 0xdc00 && low <= 0xdfff) {
        codePoint = (codePoint - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
        index += 1;
      }
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }

  return bytes;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renvoie `null` si l'encodage échoue (payload trop long par exemple) plutôt que
 * de produire un carré décoratif illisible.
 */
export function renderQrCodeSvg(payload: string, options: QrSvgOptions = {}): string | null {
  if (!payload) {
    return null;
  }

  const { size, quietZone, darkColor, lightColor } = { ...DEFAULT_OPTIONS, ...options };

  let modules: boolean[][];

  try {
    // EPC069-12 déclare le jeu de caractères UTF-8 : l'encodage doit suivre.
    // (La fabrique lit `stringToBytes` sur elle-même à chaque encodage.)
    // eslint-disable-next-line import/no-named-as-default-member
    createQrCode.stringToBytes = stringToUtf8Bytes;

    // typeNumber 0 = version automatique, 'M' = niveau de correction imposé par EPC069-12.
    const qr = createQrCode(0, 'M');
    qr.addData(payload, 'Byte');
    qr.make();

    const count = qr.getModuleCount();
    modules = Array.from({ length: count }, (_, row) =>
      Array.from({ length: count }, (_, column) => qr.isDark(row, column)),
    );
  } catch {
    return null;
  }

  const count = modules.length;

  if (count === 0) {
    return null;
  }

  const viewBoxSize = count + quietZone * 2;
  const path: string[] = [];

  // Un seul <path> : beaucoup plus léger (et plus fiable à l'impression) que N rectangles.
  modules.forEach((rowModules, row) => {
    let column = 0;

    while (column < count) {
      if (!rowModules[column]) {
        column += 1;
        continue;
      }

      let runLength = 1;

      while (column + runLength < count && rowModules[column + runLength]) {
        runLength += 1;
      }

      path.push(`M${column + quietZone} ${row + quietZone}h${runLength}v1h-${runLength}z`);
      column += runLength;
    }
  });

  if (path.length === 0) {
    return null;
  }

  const titleTag = options.title ? `<title>${escapeXml(options.title)}</title>` : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges" role="img">` +
    `${titleTag}` +
    `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${lightColor}"/>` +
    `<path d="${path.join('')}" fill="${darkColor}"/>` +
    `</svg>`
  );
}
