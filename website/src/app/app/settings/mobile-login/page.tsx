'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone } from 'lucide-react';

import { Panel } from '@/components/app/ui';
import { PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import {
  approveMobileLoginChallenge,
  buildMobileLoginQrPayload,
  createMobileLoginChallenge,
  denyMobileLoginChallenge,
  getMobileLoginStatus,
  type MobileLoginStatus,
} from '@/lib/domain/mobile-login';

export default function MobileLoginSettingsPage() {
  const { session } = useAuth();
  const { showError, showSuccess } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [status, setStatus] = useState<MobileLoginStatus | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const accessToken = session?.access_token ?? null;

  const reset = useCallback(() => {
    setQrDataUrl(null);
    setChallengeId(null);
    setStatus(null);
    setExpiresAt(null);
    setSecondsLeft(0);
  }, []);

  const generate = useCallback(async () => {
    if (!accessToken) {
      showError('Session expirée. Reconnectez-vous.');
      return;
    }

    setBusy(true);
    try {
      const created = await createMobileLoginChallenge(accessToken);
      const payload = buildMobileLoginQrPayload(created.challengeId, created.secret);
      const dataUrl = await QRCode.toDataURL(payload, {
        margin: 1,
        width: 280,
        color: { dark: '#0f1533', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
      setChallengeId(created.challengeId);
      setStatus('pending');
      setExpiresAt(created.expiresAt);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Impossible de générer le QR code.');
      reset();
    } finally {
      setBusy(false);
    }
  }, [accessToken, reset, showError]);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const expiry = expiresAt;

    function tick() {
      const remaining = Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setStatus('expired');
      }
    }

    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (!accessToken || !challengeId || !status || status === 'used' || status === 'denied' || status === 'expired') {
      return;
    }

    const timer = window.setInterval(() => {
      void getMobileLoginStatus(accessToken, challengeId)
        .then((result) => {
          setStatus(result.status);
        })
        .catch(() => undefined);
    }, 1500);

    return () => window.clearInterval(timer);
  }, [accessToken, challengeId, status]);

  async function handleApprove() {
    if (!accessToken || !challengeId) {
      return;
    }
    setBusy(true);
    try {
      const result = await approveMobileLoginChallenge(accessToken, challengeId);
      setStatus(result.status);
      showSuccess('Connexion mobile autorisée.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Impossible d’autoriser la connexion.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeny() {
    if (!accessToken || !challengeId) {
      return;
    }
    setBusy(true);
    try {
      await denyMobileLoginChallenge(accessToken, challengeId);
      setStatus('denied');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Impossible de refuser.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-4 p-5 sm:p-6">
      <Panel
        title="Connexion mobile"
        action={
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-app-accent-tint text-app-accent">
            <Smartphone size={18} strokeWidth={1.75} />
          </span>
        }>
        <p className="text-[13px] leading-relaxed text-app-text-2">
          Scannez ce QR code depuis l’application INVEQ pour vous connecter sans mot de passe. Le
          code expire en 90 secondes, ne peut être utilisé qu’une fois, et doit être confirmé ici
          après le scan.
        </p>

        <div className="mt-5 flex flex-col items-center gap-4">
          {qrDataUrl && status !== 'expired' && status !== 'denied' && status !== 'used' ? (
            <img
              alt="QR code de connexion mobile INVEQ"
              className="rounded-[14px] border border-app-border bg-white p-3"
              height={280}
              src={qrDataUrl}
              width={280}
            />
          ) : (
            <div className="flex h-[280px] w-[280px] items-center justify-center rounded-[14px] border border-dashed border-app-border bg-app-subtle text-[13px] text-app-muted">
              Aucun code actif
            </div>
          )}

          <p className="text-[12.5px] text-app-muted">
            {status === 'pending' && secondsLeft > 0
              ? `En attente du scan · expire dans ${secondsLeft}s`
              : null}
            {status === 'scanned' ? 'Téléphone détecté — confirmez que c’est bien vous.' : null}
            {status === 'approved' ? 'Autorisé. Terminez la connexion sur le téléphone.' : null}
            {status === 'denied' ? 'Connexion refusée.' : null}
            {status === 'expired' ? 'Code expiré. Générez-en un nouveau.' : null}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {status === 'scanned' ? (
            <>
              <SecondaryButton disabled={busy} onClick={() => void handleDeny()} type="button">
                Refuser
              </SecondaryButton>
              <PrimaryButton disabled={busy} onClick={() => void handleApprove()} type="button">
                Autoriser cet appareil
              </PrimaryButton>
            </>
          ) : (
            <PrimaryButton disabled={busy} onClick={() => void generate()} type="button">
              {qrDataUrl && status === 'pending' ? 'Générer un nouveau code' : 'Afficher un QR code'}
            </PrimaryButton>
          )}
        </div>
      </Panel>
    </div>
  );
}
