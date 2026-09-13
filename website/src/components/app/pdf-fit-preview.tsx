'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

import { PdfSkeleton } from '@/components/app/skeleton';
import { cn } from '@/lib/utils';

/** Largeur A4 à 96 DPI — référence pour le ratio page. */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
const A4_RATIO = A4_HEIGHT_PX / A4_WIDTH_PX;

type FitMode = 'auto' | 'page' | 'width';

/**
 * Marge interne réelle du conteneur de défilement : `p-4`, et `sm:p-5` au-delà
 * du premier point de rupture, soit 40 px au total dans le cas le plus large.
 *
 * La valeur précédente — 20 — sous-estimait cette marge d'une vingtaine de
 * pixels. L'échelle calculée produisait donc une page systématiquement plus
 * large que la place disponible : une barre de défilement apparaissait,
 * amputait la largeur utile, l'échelle était recalculée plus petite, la barre
 * disparaissait, la largeur repassait à sa valeur initiale — et le cycle
 * recommençait toutes les 80 ms. C'est ce battement qui faisait vibrer
 * l'aperçu en continu.
 */
const VIEWPORT_PADDING = 40;

/**
 * En deçà de ce seuil, un changement d'échelle est invisible et ne justifie pas
 * un rendu. Le garde-fou empêche qu'un écart d'arrondi n'entretienne à lui seul
 * une boucle mesure → rendu → mesure.
 */
const SCALE_EPSILON = 0.002;

function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  if (images.length === 0) return Promise.resolve();
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  ).then(() => undefined);
}

function measureDocument(doc: Document): { w: number; h: number } {
  const page = doc.querySelector<HTMLElement>('.page');
  const body = doc.body;
  const htmlEl = doc.documentElement;

  const w = Math.max(
    page?.scrollWidth ?? 0,
    page?.offsetWidth ?? 0,
    body.scrollWidth,
    htmlEl.scrollWidth,
    A4_WIDTH_PX,
  );

  const h = Math.max(
    page?.scrollHeight ?? 0,
    page?.offsetHeight ?? 0,
    page?.getBoundingClientRect().height ?? 0,
    body.scrollHeight,
    htmlEl.scrollHeight,
    A4_HEIGHT_PX,
  );

  return { w, h };
}

export function PdfFitPreview({
  html,
  title = 'Aperçu document',
  isLoading,
  isUpdating,
  error,
  onRetry,
  className,
  showToolbar = true,
}: {
  html?: string | null;
  title?: string;
  isLoading?: boolean;
  isUpdating?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
  showToolbar?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const measureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  const [docSize, setDocSize] = useState({ w: A4_WIDTH_PX, h: A4_HEIGHT_PX });
  const [autoScale, setAutoScale] = useState(1);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode>('auto');
  const [iframeHeight, setIframeHeight] = useState(A4_HEIGHT_PX);

  /**
   * Réinitialisation du cadrage à l'arrivée d'un nouveau document.
   *
   * C'était un effet, qui enchaînait deux `setState` après le rendu : React
   * affichait donc brièvement le document neuf avec le zoom de l'ancien avant
   * de le corriger au rendu suivant. Ajuster l'état pendant le rendu — le
   * motif recommandé pour « remettre à zéro quand une propriété change » —
   * évite ce rendu intermédiaire.
   */
  const [renderedHtml, setRenderedHtml] = useState(html);
  if (html !== renderedHtml) {
    setRenderedHtml(html);
    setZoomFactor(1);
    setFitMode('auto');
  }

  const scale = autoScale * zoomFactor;

  const measureAndFit = useCallback(async () => {
    const container = containerRef.current;
    const iframe = iframeRef.current;
    if (!container || !iframe?.contentDocument?.body) return;

    const doc = iframe.contentDocument;
    await waitForImages(doc);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const measured = measureDocument(doc);
    // Conserver la référence précédente à valeur égale : `setDocSize` avec un
    // objet neuf provoquait un rendu à chaque mesure, même sans changement.
    setDocSize((prev) => (prev.w === measured.w && prev.h === measured.h ? prev : measured));
    setIframeHeight((prev) => (prev === measured.h ? prev : measured.h));

    const cw = Math.max(container.clientWidth - VIEWPORT_PADDING, 80);
    const ch = Math.max(container.clientHeight - VIEWPORT_PADDING, 80);

    const pageCount = Math.max(1, Math.ceil(measured.h / A4_HEIGHT_PX));
    const isMultiPage = pageCount > 1;

    const fitHeight =
      fitMode === 'width'
        ? measured.h
        : fitMode === 'page' || (fitMode === 'auto' && isMultiPage)
          ? A4_HEIGHT_PX
          : Math.min(measured.h, A4_HEIGHT_PX);

    let nextScale = Math.min(cw / A4_WIDTH_PX, ch / fitHeight);

    if (fitMode === 'width') {
      nextScale = cw / A4_WIDTH_PX;
    }

    const minScale = 0.25;
    const maxScale = 1.5;
    nextScale = Math.min(maxScale, Math.max(minScale, nextScale));

    setAutoScale((prev) => (Math.abs(prev - nextScale) < SCALE_EPSILON ? prev : nextScale));
  }, [fitMode]);

  const scheduleMeasure = useCallback(() => {
    if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
    measureTimerRef.current = setTimeout(() => {
      void measureAndFit();
    }, 80);
  }, [measureAndFit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => scheduleMeasure());
    observer.observe(container);
    return () => observer.disconnect();
  }, [scheduleMeasure]);

  useEffect(() => {
    scheduleMeasure();
  }, [html, scheduleMeasure, fitMode, zoomFactor]);

  useEffect(() => {
    mutationObserverRef.current?.disconnect();
    mutationObserverRef.current = null;

    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc?.body || !html) return;

    const observer = new MutationObserver(() => scheduleMeasure());
    observer.observe(doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    mutationObserverRef.current = observer;

    return () => observer.disconnect();
  }, [html, scheduleMeasure]);

  useEffect(
    () => () => {
      if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
      mutationObserverRef.current?.disconnect();
    },
    [],
  );

  const handleIframeLoad = () => {
    scheduleMeasure();
    setTimeout(() => scheduleMeasure(), 150);
    setTimeout(() => scheduleMeasure(), 500);
  };

  const zoomPercent = Math.round(scale * 100);
  const scaledW = A4_WIDTH_PX * scale;
  const scaledH = docSize.h * scale;

  function adjustZoom(delta: number) {
    setZoomFactor((z) => Math.min(2, Math.max(0.5, Math.round((z + delta) * 10) / 10)));
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.05),transparent_50%),#f1f5f9]', className)}>
      {showToolbar ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/90 bg-white/95 px-3 py-2 backdrop-blur-sm">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Aperçu PDF
          </p>
          <div className="flex items-center gap-1">
            {isUpdating ? (
              <span className="mr-2 flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200/80">
                <Loader2 className="animate-spin" size={11} />
                Mise à jour
              </span>
            ) : null}
            <button
              className={cn(
                'rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition',
                fitMode === 'page'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100',
              )}
              onClick={() => setFitMode((m) => (m === 'page' ? 'auto' : 'page'))}
              title="Ajuster à la page"
              type="button">
              Page
            </button>
            <button
              className={cn(
                'rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition',
                fitMode === 'width'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100',
              )}
              onClick={() => setFitMode((m) => (m === 'width' ? 'auto' : 'width'))}
              title="Ajuster à la largeur"
              type="button">
              Largeur
            </button>
            <button
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
              onClick={() => {
                setFitMode('auto');
                setZoomFactor(1);
                scheduleMeasure();
              }}
              title="Réinitialiser le zoom"
              type="button">
              <Maximize2 size={14} />
            </button>
            <button
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
              onClick={() => adjustZoom(-0.1)}
              type="button">
              <ZoomOut size={14} />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums text-slate-600">
              {zoomPercent}%
            </span>
            <button
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
              onClick={() => adjustZoom(0.1)}
              type="button">
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      ) : null}

      <div
        className="relative min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]"
        ref={containerRef}>
        {isLoading ? (
          <div className="absolute inset-3">
            <PdfSkeleton />
          </div>
        ) : error ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-slate-500">Impossible de générer l&apos;aperçu.</p>
            {onRetry ? (
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition hover:bg-primary-dark"
                onClick={onRetry}
                type="button">
                Réessayer
              </button>
            ) : null}
          </div>
        ) : html ? (
          <div className="flex min-h-full w-full justify-center p-4 sm:p-5">
            <div
              className="relative shrink-0 rounded-xl bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/70 transition-shadow"
              style={{
                width: scaledW,
                height: scaledH,
              }}>
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{
                  width: A4_WIDTH_PX,
                  height: iframeHeight,
                  transform: `scale(${scale})`,
                }}>
                <iframe
                  className="block border-0 bg-white"
                  onLoad={handleIframeLoad}
                  ref={iframeRef}
                  sandbox="allow-same-origin"
                  srcDoc={html}
                  style={{
                    width: A4_WIDTH_PX,
                    height: iframeHeight,
                  }}
                  title={title}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-500">
            Aucun aperçu disponible.
          </div>
        )}
      </div>
    </div>
  );
}

export { A4_RATIO };
