import { supabase } from '@/lib/supabase';

/**
 * Logos et signatures d'entreprise (bucket privé `company-assets`).
 *
 * Les URL enregistrées sont de la forme « …/object/public/company-assets/… »,
 * mais le bucket est privé : ces adresses ne répondent pas. On lit donc le
 * fichier avec la session de l'utilisateur (téléchargement authentifié) ou une
 * URL signée de courte durée pour l'affichage.
 */

export const COMPANY_ASSETS_BUCKET = 'company-assets';

const ASSET_URL_PATTERN = new RegExp(
  `/storage/v1/object/(?:public|sign|authenticated)/${COMPANY_ASSETS_BUCKET}/([^?#]+)`,
);

/** Chemin du fichier dans le bucket, ou null si l'URL n'est pas un fichier d'entreprise. */
export function companyAssetPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(ASSET_URL_PATTERN);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Fichier brut : via le stockage authentifié si possible, sinon par simple téléchargement. */
export async function loadCompanyAssetBlob(url: string): Promise<Blob | null> {
  if (url.startsWith('data:')) {
    const response = await fetch(url);
    return response.ok ? response.blob() : null;
  }
  const path = companyAssetPath(url);
  if (path) {
    const { data, error } = await supabase.storage.from(COMPANY_ASSETS_BUCKET).download(path);
    if (!error && data) return data;
  }
  try {
    const response = await fetch(url);
    return response.ok ? await response.blob() : null;
  } catch {
    return null;
  }
}

/** Adresse affichable dans une balise <img> (URL signée 1 h pour un fichier du bucket privé). */
export async function companyAssetDisplayUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const path = companyAssetPath(url);
  if (!path) return url;
  const { data, error } = await supabase.storage.from(COMPANY_ASSETS_BUCKET).createSignedUrl(path, 3600);
  return error || !data?.signedUrl ? null : data.signedUrl;
}

export type PreparedImage = { dataUri: string; width: number; height: number };

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image illisible.'));
    reader.onerror = () => reject(reader.error ?? new Error('Image illisible.'));
    reader.readAsDataURL(blob);
  });
}

async function decodeImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    // L'image décodée reste utilisable après la révocation.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Cadre utile d'un logo : on retire les marges uniformes (fond blanc ou
 * transparent) autour du dessin, pour qu'il occupe vraiment la place prévue.
 */
export function findContentBox(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } | null {
  const at = (x: number, y: number) => (y * width + x) * 4;
  const corner = at(0, 0);
  const bgAlpha = pixels[corner + 3];
  const transparentBg = bgAlpha < 16;
  const [br, bg, bb] = [pixels[corner], pixels[corner + 1], pixels[corner + 2]];
  // Fond « blanc » seulement si le coin est clair : un logo sur fond coloré n'est pas rogné.
  const lightBg = !transparentBg && br > 225 && bg > 225 && bb > 225;
  if (!transparentBg && !lightBg) return null;

  const isBackground = (index: number) => {
    const alpha = pixels[index + 3];
    if (alpha < 16) return true;
    if (transparentBg) return false;
    return (
      Math.abs(pixels[index] - br) < 18 &&
      Math.abs(pixels[index + 1] - bg) < 18 &&
      Math.abs(pixels[index + 2] - bb) < 18
    );
  };

  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isBackground(at(x, y))) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (bottom < 0) return null;

  // Petite respiration autour du dessin.
  const pad = Math.round(Math.max(right - left, bottom - top) * 0.02);
  const x = Math.max(0, left - pad);
  const y = Math.max(0, top - pad);
  const box = {
    x,
    y,
    width: Math.min(width, right + pad + 1) - x,
    height: Math.min(height, bottom + pad + 1) - y,
  };
  // Rien à rogner, ou presque : on garde l'image telle quelle.
  if (box.width >= width - 2 && box.height >= height - 2) return null;
  if (box.width < 4 || box.height < 4) return null;
  return box;
}

/**
 * Logo prêt pour un PDF ou un envoi : marges rognées, au plus `maxSide` px,
 * PNG s'il a de la transparence, sinon JPEG. Renvoie aussi ses dimensions,
 * qui servent à le dimensionner selon sa forme dans chaque modèle.
 */
export async function prepareLogoImage(blob: Blob, maxSide = 1200): Promise<PreparedImage> {
  const image = await decodeImage(blob);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (!naturalWidth || !naturalHeight) throw new Error('Image vide.');

  // Analyse sur une version réduite (rapide), puis découpe sur l'original.
  const probeScale = Math.min(1, 600 / Math.max(naturalWidth, naturalHeight));
  const probeWidth = Math.max(1, Math.round(naturalWidth * probeScale));
  const probeHeight = Math.max(1, Math.round(naturalHeight * probeScale));
  const probe = document.createElement('canvas');
  probe.width = probeWidth;
  probe.height = probeHeight;
  const probeContext = probe.getContext('2d', { willReadFrequently: true });
  if (!probeContext) throw new Error('Canvas indisponible.');
  probeContext.drawImage(image, 0, 0, probeWidth, probeHeight);
  const pixels = probeContext.getImageData(0, 0, probeWidth, probeHeight).data;

  let hasAlpha = false;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 250) {
      hasAlpha = true;
      break;
    }
  }

  const box = findContentBox(pixels, probeWidth, probeHeight);
  const crop = box
    ? {
        x: box.x / probeScale,
        y: box.y / probeScale,
        width: box.width / probeScale,
        height: box.height / probeScale,
      }
    : { x: 0, y: 0, width: naturalWidth, height: naturalHeight };

  const scale = Math.min(1, maxSide / Math.max(crop.width, crop.height));
  const width = Math.max(1, Math.round(crop.width * scale));
  const height = Math.max(1, Math.round(crop.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponible.');
  context.imageSmoothingQuality = 'high';
  if (!hasAlpha) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);

  const dataUri = hasAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92);
  return { dataUri, width, height };
}

/** Logo embarquable dans un PDF ; à défaut de canvas, l'image d'origine. */
export async function inlineLogo(url: string): Promise<{ dataUri: string; ratio: number | null } | null> {
  const blob = await loadCompanyAssetBlob(url);
  if (!blob) return null;
  try {
    const prepared = await prepareLogoImage(blob);
    return { dataUri: prepared.dataUri, ratio: prepared.width / prepared.height };
  } catch {
    try {
      return { dataUri: await blobToDataUri(blob), ratio: null };
    } catch {
      return null;
    }
  }
}

/** Image quelconque (signature) embarquée telle quelle. */
export async function inlineImage(url: string): Promise<string | null> {
  const blob = await loadCompanyAssetBlob(url);
  if (!blob) return null;
  try {
    return await blobToDataUri(blob);
  } catch {
    return null;
  }
}

/** Fichier prêt à l'envoi : logo rogné et réduit (PNG ou JPEG). */
export async function prepareLogoFile(file: File): Promise<File> {
  try {
    const prepared = await prepareLogoImage(file);
    const blob = await (await fetch(prepared.dataUri)).blob();
    const extension = blob.type === 'image/png' ? 'png' : 'jpg';
    return new File([blob], `logo.${extension}`, { type: blob.type });
  } catch {
    return file;
  }
}
