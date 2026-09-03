import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Text } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import {
  getMobileLoginStatus,
  parseMobileLoginQrPayload,
  redeemMobileLoginChallenge,
  scanMobileLoginChallenge,
} from '@/lib/auth/mobile-login';
import { supabase } from '@/lib/supabase';
import { typography } from '@/constants/theme/typography';

type Phase = 'idle' | 'waiting' | 'done' | 'error';

/**
 * Connexion QR sans module caméra natif.
 * Le scan caméra est retiré du binaire iOS (crash TestFlight 57/59 :
 * expo-camera + expo-iap s’initialisaient au process start).
 * Le deep link `inveq://mlc?c=&s=` reste fonctionnel.
 */
export default function LoginQrScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ c?: string; s?: string }>();
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState(
    'Ouvrez le QR depuis INVEQ.fr → Paramètres → Connexion mobile, ou utilisez e-mail et mot de passe.',
  );
  const handledRef = useRef(false);

  const completeLogin = useCallback(async (challengeId: string, secret: string) => {
    setPhase('waiting');
    setMessage('QR code reconnu. Confirmez la connexion sur votre ordinateur…');

    await scanMobileLoginChallenge(challengeId, secret);

    const started = Date.now();
    while (Date.now() - started < 120_000) {
      const status = await getMobileLoginStatus({ challengeId, secret });

      if (status.status === 'denied' || status.status === 'expired') {
        throw new Error(
          status.status === 'denied'
            ? 'Connexion refusée depuis l’ordinateur.'
            : 'Le QR code a expiré. Générez-en un nouveau.',
        );
      }

      if (status.status === 'approved') {
        const redeemed = await redeemMobileLoginChallenge(challengeId, secret);
        const { error } = await supabase.auth.verifyOtp({
          token_hash: redeemed.tokenHash,
          type: 'magiclink',
        });
        if (error) {
          throw error;
        }
        setPhase('done');
        router.replace('/');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error('Délai dépassé. Confirmez plus rapidement sur l’ordinateur.');
  }, []);

  const handlePayload = useCallback(
    (raw: string) => {
      if (handledRef.current) {
        return;
      }

      const parsed = parseMobileLoginQrPayload(raw);
      if (!parsed) {
        return;
      }

      handledRef.current = true;
      void completeLogin(parsed.challengeId, parsed.secret).catch((error: unknown) => {
        handledRef.current = false;
        setPhase('error');
        setMessage(error instanceof Error ? error.message : 'Connexion impossible.');
      });
    },
    [completeLogin],
  );

  useEffect(() => {
    const challengeId = typeof params.c === 'string' ? params.c : undefined;
    const secret = typeof params.s === 'string' ? params.s : undefined;
    if (challengeId && secret) {
      handlePayload(`inveq://mlc?c=${challengeId}&s=${secret}`);
    }
  }, [handlePayload, params.c, params.s]);

  return (
    <AuthScreen
      footer={
        <Button onPress={() => router.replace('/login' as Href)} title="Retour à la connexion" variant="ghost" />
      }
      subtitle={
        Platform.OS === 'web'
          ? 'Le scan du QR code est disponible dans l’application iOS ou Android.'
          : message
      }
      title="Connexion QR">
      <Text style={styles.hint}>
        {phase === 'waiting'
          ? 'En attente de confirmation…'
          : 'Le scan caméra est temporairement désactivé pour stabiliser iOS. Ouvrez le lien du QR, ou connectez-vous avec e-mail et mot de passe.'}
      </Text>
    </AuthScreen>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    hint: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }));
}
