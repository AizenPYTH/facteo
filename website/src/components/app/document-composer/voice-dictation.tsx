'use client';

import Link from 'next/link';
import { Loader2, Mic, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useSubscription } from '@/hooks/use-subscription';
import { processVoiceCommand, type VoiceCommandResult } from '@/lib/domain/ai/voice-command';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'recording' | 'processing';

/** Durée maximale d'une dictée : au-delà, l'enregistrement s'arrête seul. */
const MAX_SECONDS = 120;

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? '';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('Lecture de l’enregistrement impossible.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Dictée d'une facture ou d'un devis : on parle, l'IA remplit le client, les
 * lignes, la TVA et le délai de paiement. Le résultat est remis à l'éditeur.
 */
export function VoiceDictation({
  kind,
  onResult,
}: {
  kind: 'invoice' | 'quote';
  onResult: (result: VoiceCommandResult) => Promise<string>;
}) {
  const { hasFeature } = useSubscription();
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const locked = !hasFeature('ai_assistant');

  async function start() {
    setError(null);
    setMessage(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Ce navigateur ne permet pas d’utiliser le micro.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Micro refusé. Autorisez le micro pour ce site dans le navigateur, puis réessayez.');
      return;
    }

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      void finish(new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' }));
    };

    recorderRef.current = recorder;
    recorder.start();
    setSeconds(0);
    setPhase('recording');
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS && recorder.state === 'recording') {
        recorder.stop();
      }
    }, 1000);
  }

  function stop() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  }

  async function finish(blob: Blob) {
    if (blob.size < 2000) {
      setPhase('idle');
      setError('Enregistrement trop court. Maintenez la dictée quelques secondes.');
      return;
    }
    setPhase('processing');
    try {
      const result = await processVoiceCommand({
        documentType: kind,
        audioBase64: await blobToBase64(blob),
        mimeType: blob.type.split(';')[0] || 'audio/webm',
      });
      setMessage(await onResult(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dictée impossible.');
    } finally {
      setPhase('idle');
    }
  }

  return (
    <div className="rounded-app-card border border-app-border bg-app-surface p-3.5">
      <div className="flex items-center gap-3">
        {phase === 'recording' ? (
          <button
            aria-label="Arrêter la dictée"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-app-danger text-white shadow-sm transition-transform duration-150 active:scale-95"
            onClick={stop}
            type="button">
            <Square fill="currentColor" size={15} />
          </button>
        ) : (
          <button
            aria-label={kind === 'invoice' ? 'Dicter la facture' : 'Dicter le devis'}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full bg-app-accent text-white shadow-sm transition-transform duration-150 active:scale-95 disabled:opacity-50',
            )}
            disabled={locked || phase === 'processing'}
            onClick={() => void start()}
            type="button">
            {phase === 'processing' ? <Loader2 className="animate-spin" size={18} /> : <Mic size={18} />}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-app-text">
            {phase === 'recording'
              ? `Je vous écoute… ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
              : phase === 'processing'
                ? 'Analyse de la dictée…'
                : kind === 'invoice'
                  ? 'Dicter la facture'
                  : 'Dicter le devis'}
          </p>
          <p className="text-[12px] leading-snug text-app-muted">
            {phase === 'recording'
              ? 'Appuyez sur le carré quand vous avez fini.'
              : '« Facture pour Boulangerie Martin : 12 heures de main-d’œuvre à 45 €, un iPhone 15 Pro Max à 749 €, paiement à 30 jours. »'}
          </p>
        </div>
      </div>
      {locked ? (
        <p className="mt-2 text-[12px] text-app-muted">
          Dictée réservée à l’offre avec assistant IA.{' '}
          <Link className="font-semibold text-app-accent hover:underline" href="/tarifs">
            Voir les offres
          </Link>
        </p>
      ) : null}
      {message ? <p className="mt-2 text-[12px] font-medium text-app-success-text">{message}</p> : null}
      {error ? <p className="mt-2 text-[12px] font-medium text-app-danger-text">{error}</p> : null}
    </div>
  );
}
