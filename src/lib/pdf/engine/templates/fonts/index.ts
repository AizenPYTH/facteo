import { EMBEDDED_FONT_LOADERS } from '@/lib/pdf/engine/templates/fonts/families';

/**
 * Polices intégrées au PDF.
 *
 * Les modèles nomment des polices (Playfair Display, Courier Prime…) que ni
 * le téléphone ni le navigateur ne possèdent : sans fichier joint, tout
 * retombait sur la police système et les modèles se ressemblaient tous. On
 * joint donc, en base64, uniquement les familles réellement citées par le
 * document : le PDF garde son écriture hors ligne, sur l'app comme sur le site.
 */
export async function embedPdfFonts(html: string): Promise<string> {
  const used = Object.keys(EMBEDDED_FONT_LOADERS).filter((family) => html.includes(`'${family}'`));
  if (used.length === 0) {
    return html;
  }

  const fonts = await Promise.all(used.map((family) => EMBEDDED_FONT_LOADERS[family]()));
  const css = fonts
    .flatMap(({ default: font }) =>
      font.faces.map(
        (face) =>
          `@font-face{font-family:'${font.family}';font-style:normal;font-weight:${face.weight};font-display:block;src:url(data:font/woff2;base64,${face.data}) format('woff2');}`,
      ),
    )
    .join('');

  return html.replace('</head>', `<style>${css}</style></head>`);
}
