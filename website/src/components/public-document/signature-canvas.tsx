'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SignatureCanvasProps = {
  /** PNG (data URI) dès qu'un trait est tracé, null quand le cadre est vide. */
  onChange: (dataUri: string | null) => void;
  disabled?: boolean;
};

const WIDTH = 600;
const HEIGHT = 200;

/**
 * Cadre de signature au doigt (téléphone) ou à la souris (ordinateur).
 * Le dessin est exporté en PNG sur fond transparent.
 */
export function SignatureCanvas({ onChange, disabled }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  };

  const handleDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    last.current = point(event);
    const ctx = event.currentTarget.getContext('2d');
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    }
  };

  const handleMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    event.preventDefault();
    const ctx = event.currentTarget.getContext('2d');
    const next = point(event);
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }
    last.current = next;
    strokes.current += 1;
  };

  const handleUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    // Un simple clic n'est pas une signature.
    if (strokes.current < 8 || !canvasRef.current) return;
    setEmpty(false);
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, WIDTH, HEIGHT);
    strokes.current = 0;
    setEmpty(true);
    onChange(null);
  }, [onChange]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          aria-label="Cadre de signature"
          className="block h-40 w-full touch-none select-none sm:h-48"
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          onPointerLeave={handleUp}
        />
        {empty ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Signez ici, au doigt ou à la souris
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={clear}
          disabled={disabled || empty}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-40"
        >
          Effacer
        </button>
      </div>
    </div>
  );
}
