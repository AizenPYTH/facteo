'use client';

import { useEffect, useRef } from 'react';

/**
 * Coller une image (Ctrl+V / Cmd+V) n'importe où sur la page la transmet à
 * `onImages`, sans passer par un fichier enregistré. Un collage de texte garde
 * son comportement normal.
 */
export function useImagePaste(onImages: (files: File[]) => void, enabled = true) {
  const handlerRef = useRef(onImages);

  useEffect(() => {
    handlerRef.current = onImages;
  }, [onImages]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handlePaste(event: ClipboardEvent) {
      const images = Array.from(event.clipboardData?.items ?? [])
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (images.length === 0) {
        return;
      }

      event.preventDefault();
      handlerRef.current(images);
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [enabled]);
}
