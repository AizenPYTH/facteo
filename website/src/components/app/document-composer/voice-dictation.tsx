'use client';

import Link from 'next/link';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Kbd } from '@/components/app/document-composer/ui';
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

export type VoiceDictationHandle = {
  /** Lance la dictée (raccourci Ctrl D). Sans effet si elle est déjà en cours ou verrouillée. */
  start: () => void;
};

const MicIcon = ({ size = 20 }: { size?: number }) => (
  <svg aria-hidden fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size}>
    <rect height="11" rx="3" width="6" x="9" y="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

/** Onde animée (barres en `scaleY`, 0,7 à 1,2 s). */
function Wave() {
  return (
    <div aria-hidden className="hidden h-8 items-center gap-[3px] sm:flex">
      {Array.from({ length: 26 }, (_, index) => (
        <span
          className="block w-[3px] origin-center rounded-[2px] bg-iq-accent"
          key={index}
          style={{
            height: 8 + ((index * 37) % 24),
            opacity: 0.35 + ((index * 13) % 10) / 16,
            animation: `iq-wave ${0.7 + (index % 5) * 0.13}s ease-in-out ${(index % 7) * 0.08}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Dictée d'une facture ou d'un devis : on parle, l'IA remplit le client, les
 * lignes, la TVA et le délai de paiement. Le résultat est remis à l'éditeur.
 *
 * Au repos : carte compacte (micro, titre, raccourci Ctrl D). Pendant la dictée,
 * la carte s'agrandit sur place : micro pulsant, onde, minuterie, actions.
 */
export function VoiceDictation({
  handleRef,
  kind,
  onResult,
}: {
  handleRef?: React.Ref<VoiceDictationHandle>;
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
  /** « Annuler » pendant l'écoute : l'enregistrement est jeté, pas analysé. */
  const discardRef = useRef(false);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const locked = !hasFeature('ai_assistant');
  const label = kind === 'invoice' ? 'Dicter la facture' : 'Dicter le devis';

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

  async function start() {
    if (locked || phase !== 'idle') return;
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
      if (discardRef.current) {
        discardRef.current = false;
        setPhase('idle');
        return;
      }
      void finish(new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' }));
    };

    recorderRef.current = recorder;
    discardRef.current = false;
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

  function cancel() {
    discardRef.current = true;
    stop();
  }

  useImperativeHandle(handleRef, () => ({ start: () => void start() }));

  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  if (phase !== 'idle') {
    const recording = phase === 'recording';
    return (
      <div
        aria-live="polite"
        className="rounded-[18px] border-[1.5px] border-iq-accent bg-iq-surface px-[22px] py-5 shadow-[0_0_0_5px_var(--iq-accent-soft)]">
        <div className="flex items-center gap-3.5">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full bg-iq-accent text-white',
              recording && '[animation:iq-pulse_1.4s_ease-out_infinite]',
            )}>
            {recording ? (
              <MicIcon />
            ) : (
              <svg aria-hidden className="animate-spin" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24" width="20">
                <path d="M12 3a9 9 0 1 0 9 9" />
              </svg>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold">
              {recording ? 'Écoute en cours' : 'Analyse de la dictée…'}
            </p>
            <p className="mt-0.5 text-[12.5px] text-iq-ink3">
              {recording
                ? `${timer} · parlez naturellement, INVEQ structure la ${kind === 'invoice' ? 'facture' : 'devis'}`
                : 'Client, lignes, TVA et délai sont en cours de remplissage.'}
            </p>
          </div>
          <div className="flex-1" />
          {recording ? <Wave /> : null}
        </div>
        {recording ? (
          <>
            <p className="mt-[18px] text-[16px] leading-[1.55] tracking-[-0.2px] text-iq-ink3 [text-wrap:pretty] sm:text-[18px]">
              Par exemple : « Facture pour Boulangerie Martin : 12 heures de main-d’œuvre à 45 €, un
              iPhone 15 Pro Max à 749 €, paiement à 30 jours. »
            </p>
            <div className="mt-[18px] flex flex-wrap gap-2.5">
              <button
                className="h-10 rounded-[10px] bg-iq-accent px-[18px] text-[13.5px] font-bold text-white transition-[filter] duration-150 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent focus-visible:ring-offset-2"
                onClick={stop}
                type="button">
                Terminer et remplir
              </button>
              <button
                className="h-10 rounded-[10px] border border-iq-line bg-transparent px-4 text-[13.5px] font-semibold text-iq-ink2 transition-colors duration-150 hover:bg-iq-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
                onClick={cancel}
                type="button">
                Annuler
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        aria-keyshortcuts="Control+D"
        className="flex w-full items-center gap-3.5 rounded-[16px] border border-iq-line bg-iq-surface py-3 pl-3 pr-3.5 text-left transition-colors duration-150 ease-out hover:border-iq-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent disabled:cursor-not-allowed disabled:hover:border-iq-line"
        disabled={locked}
        onClick={() => void start()}
        type="button">
        <span
          className={cn(
            'flex size-[42px] shrink-0 items-center justify-center rounded-[12px] text-white',
            locked ? 'bg-iq-ink3' : 'bg-iq-accent',
          )}>
          <MicIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-bold">{label}</span>
          <span className="mt-0.5 block text-[13px] text-iq-ink3">
            Dites le client, les prestations et le délai : tout se remplit.
          </span>
        </span>
        <span aria-hidden className="hidden items-center gap-1 sm:flex">
          <Kbd className="h-[22px] bg-iq-soft">Ctrl</Kbd>
          <Kbd className="h-[22px] bg-iq-soft">D</Kbd>
        </span>
      </button>
      {locked ? (
        <p className="mt-2 px-1 text-[12.5px] text-iq-ink3">
          Dictée réservée à l’offre avec assistant IA.{' '}
          <Link className="font-semibold text-iq-accent hover:underline" href="/tarifs">
            Voir les offres
          </Link>
        </p>
      ) : null}
      {message ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-[10px] bg-iq-ok-soft px-3 py-2 text-[12.5px] font-semibold text-iq-ok" role="status">
          <svg aria-hidden className="mt-px shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" viewBox="0 0 24 24" width="14">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 rounded-[10px] bg-iq-danger-soft px-3 py-2 text-[12.5px] font-semibold text-iq-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
