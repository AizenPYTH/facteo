'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { AppDialog } from '@/components/app/app-dialog';
import { PdfSheet, useRenderedPdfHtml } from '@/components/app/document-composer/preview';
import { renderLegalIdsBlockHtml, type PdfDocumentInput } from '@/lib/pdf/engine';

/** A4 à 96 DPI, comme le moteur PDF. */
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

/** Premier emplacement proposé : en haut à gauche, sous la marge. */
const DEFAULT_POINT = { x: 0.06, y: 0.025 };

type Point = { x: number; y: number };

function clamp(value: number, max: number): number {
  return Math.min(Math.max(0, max), Math.max(0, value));
}

/**
 * La facture s'ouvre en grand, le bloc SIREN / SIRET / TVA posé dessus : on le
 * fait glisser où l'on veut (souris, doigt ou flèches du clavier), puis
 * « Enregistrer ». Rien d'autre n'est modifiable ici.
 */
export function LegalIdsPlacementEditor({
  input,
  initial,
  onClose,
  onSave,
  open,
}: {
  input: PdfDocumentInput | null;
  initial: Point | null;
  onClose: () => void;
  onSave: (point: Point) => void;
  open: boolean;
}) {
  return (
    <AppDialog
      description="Faites glisser le bloc à l’endroit voulu sur la facture, puis enregistrez."
      onClose={onClose}
      open={open}
      size="lg"
      title="Placer le SIREN, le SIRET et la TVA">
      {open ? <EditorBody initial={initial} input={input} onClose={onClose} onSave={onSave} /> : null}
    </AppDialog>
  );
}

function EditorBody({
  input,
  initial,
  onClose,
  onSave,
}: {
  input: PdfDocumentInput | null;
  initial: Point | null;
  onClose: () => void;
  onSave: (point: Point) => void;
}) {
  const [point, setPoint] = useState<Point>(initial ?? DEFAULT_POINT);
  const frameRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerX: number; pointerY: number; start: Point } | null>(null);
  const [width, setWidth] = useState(0);
  const [blockSize, setBlockSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fond : la facture sans les identifiants, qui sont dessinés par-dessus.
  const backgroundInput = useMemo(
    () => (input ? { ...input, issuerLegalIds: [], legalIdsPlacement: 'auto' as const } : null),
    [input],
  );
  const html = useRenderedPdfHtml(backgroundInput);
  const blockHtml = useMemo(() => (input ? renderLegalIdsBlockHtml(input) : ''), [input]);

  const scale = width > 0 ? width / A4_WIDTH : 0;
  const showBlock = Boolean(blockHtml) && scale > 0;

  // Taille réelle du bloc (hors mise à l'échelle) : il doit rester entier sur la page.
  useEffect(() => {
    const element = blockRef.current;
    if (!element || !showBlock) return;
    const observer = new ResizeObserver(([entry]) =>
      setBlockSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [showBlock]);

  /** Le bloc reste entier sur la page. */
  function clampPoint(next: Point): Point {
    return {
      x: Math.round(clamp(next.x, 1 - blockSize.width / A4_WIDTH) * 10000) / 10000,
      y: Math.round(clamp(next.y, 1 - blockSize.height / A4_HEIGHT) * 10000) / 10000,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, start: point };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || scale === 0) return;
    const dx = (event.clientX - drag.pointerX) / (A4_WIDTH * scale);
    const dy = (event.clientY - drag.pointerY) / (A4_HEIGHT * scale);
    setPoint(clampPoint({ x: drag.start.x + dx, y: drag.start.y + dy }));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 0.02 : 0.004;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setPoint((current) => clampPoint({ x: current.x + move.x, y: current.y + move.y }));
  }

  return (
    <>
      <div className="bg-app-subtle px-4 py-5 sm:px-8">
        {blockHtml ? null : (
          <p className="mb-4 rounded-[10px] bg-iq-soft px-3.5 py-3 text-[13px] text-iq-ink2">
            Aucun identifiant à placer : cochez le SIREN, le SIRET ou la TVA (renseignés dans la page
            Entreprise).
          </p>
        )}
        <div
          className="relative mx-auto w-full select-none shadow-[0_1px_3px_rgba(20,18,40,.12),0_8px_24px_rgba(20,18,40,.08)]"
          ref={frameRef}
          // Page entière visible : on déplace le bloc sans faire défiler.
          style={{ maxWidth: 'min(560px, calc((88vh - 230px) * 0.707))' }}>
          <PdfSheet html={html} title="Facture" />
          {showBlock ? (
            <div
              aria-label="Bloc SIREN, SIRET et TVA : faites-le glisser, ou utilisez les flèches du clavier"
              className="absolute z-10 cursor-grab touch-none rounded-[4px] outline-dashed outline-2 outline-offset-2 outline-iq-accent focus-visible:outline-solid active:cursor-grabbing"
              onKeyDown={handleKeyDown}
              onPointerCancel={handlePointerUp}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              role="button"
              style={{
                left: point.x * A4_WIDTH * scale,
                top: point.y * A4_HEIGHT * scale,
                background: 'rgba(79, 70, 229, 0.08)',
              }}
              tabIndex={0}>
              {/* Taille réelle du bloc mise à l'échelle de l'aperçu. */}
              <div style={{ width: blockSize.width * scale, height: blockSize.height * scale }}>
                <div
                  className="origin-top-left whitespace-nowrap"
                  dangerouslySetInnerHTML={{ __html: blockHtml }}
                  ref={blockRef}
                  style={{ transform: `scale(${scale})`, width: 'max-content' }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-app-border-soft bg-app-subtle px-[22px] py-3.5">
        <button
          className="h-10 rounded-[10px] px-4 text-[14px] font-semibold text-iq-ink2 hover:bg-iq-soft"
          onClick={onClose}
          type="button">
          Annuler
        </button>
        <button
          className="h-10 rounded-[10px] bg-iq-accent px-5 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
          disabled={!blockHtml}
          onClick={() => {
            onSave(clampPoint(point));
            onClose();
          }}
          type="button">
          Enregistrer
        </button>
      </div>
    </>
  );
}
