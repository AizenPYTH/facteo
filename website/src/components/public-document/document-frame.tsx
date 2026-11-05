'use client';

import { useEffect, useRef, useState } from 'react';

import { PDF_LAYOUT } from '@/lib/pdf/engine/layout';

/**
 * Aperçu fidèle au PDF, réduit à la largeur de l'écran (téléphone compris).
 * Aucun script ne s'exécute dans le document (sandbox sans allow-scripts).
 */
export function DocumentFrame({ html, title }: { html: string; title: string }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(PDF_LAYOUT.renderWidthPx);
  const [height, setHeight] = useState<number>(PDF_LAYOUT.renderHeightPx);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(1, width / PDF_LAYOUT.renderWidthPx);

  return (
    <div ref={wrapperRef} className="w-full overflow-hidden" style={{ height: height * scale }}>
      <iframe
        title={title}
        srcDoc={html}
        sandbox="allow-same-origin"
        scrolling="no"
        onLoad={(event) => {
          const doc = event.currentTarget.contentDocument;
          const measured = doc ? Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0) : 0;
          if (measured > 0) setHeight(measured);
        }}
        style={{
          width: PDF_LAYOUT.renderWidthPx,
          height,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}
