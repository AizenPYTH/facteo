import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

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
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type Phase = 'camera' | 'waiting' | 'done' | 'error';

export default function LoginQrScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ c?: string; s?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('camera');
  const [message, setMessage] = useState(
    'Scannez le QR code affiché sur INVEQ.fr → Paramètres → Connexion mobile.',
  );
  const handledRef = useRef(false);

  const completeLogin = useCallback(async (challengeId: string, secret: string) => {
    setPhase('waiting');
    setMessage('QR code reconnu. Confirmez la connexion sur votre ordinateur…');

    await scanMobileLoginChallenge(challengeId, secret);

    const started = Date.now();
    while (Date.now() - started < 120_000) {
      const status = await getMobileLoginStatus({ challengeId, secret });

      if (status.status === 'denied' || status.status === 'expired' || status.status === 'used') {
        throw new Error(
          status.status === 'denied'
            ? 'Connexion refusée depuis l’ordinateur.'
            : status.status === 'used'
              ? 'Ce QR code a déjà été utilisé. Générez-en un nouveau.'
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
        setPhase('error');
        setMessage(
          'QR code invalide. Utilisez uniquement le QR affiché sur INVEQ.fr → Paramètres → Connexion mobile.',
        );
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

  function resumeScan() {
    handledRef.current = false;
    setPhase('camera');
    setMessage('Scannez le QR code affiché sur INVEQ.fr → Paramètres → Connexion mobile.');
  }

  if (Platform.OS === 'web') {
    return (
      <AuthScreen
        footer={<Button onPress={() => router.replace('/login' as Href)} title="Retour" variant="ghost" />}
        subtitle="Le scan du QR code est disponible dans l’application iOS ou Android."
        title="Connexion QR">
        <Text style={styles.hint}>
          Ouvrez INVEQ sur votre téléphone, puis choisissez « Se connecter avec un QR code ».
        </Text>
      </AuthScreen>
    );
  }

  if (!permission) {
    return (
      <AuthScreen footer={<View />} subtitle="Préparation de l’appareil photo." title="QR code">
        <Text style={styles.hint}>Chargement des permissions…</Text>
      </AuthScreen>
    );
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain !== false;
    return (
      <AuthScreen
        footer={
          <>
            <Button
              onPress={() => {
                if (canAskAgain) {
                  void requestPermission();
                  return;
                }
                void Linking.openSettings();
              }}
              title={canAskAgain ? 'Autoriser l’appareil photo' : 'Ouvrir les réglages'}
            />
            <Button onPress={() => router.replace('/login' as Href)} title="Retour" variant="ghost" />
          </>
        }
        subtitle="L’appareil photo sert uniquement à scanner le QR code de connexion."
        title="QR code">
        <Text style={styles.hint}>
          {canAskAgain
            ? 'Autorisez l’appareil photo pour continuer.'
            : 'L’accès caméra a été refusé. Activez-le dans les réglages de l’appareil, puis revenez ici.'}
        </Text>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      footer={
        <>
          {phase === 'error' ? <Button onPress={resumeScan} title="Scanner un autre QR" /> : null}
          <Button onPress={() => router.replace('/login' as Href)} title="Retour à la connexion" variant="ghost" />
        </>
      }
      subtitle={message}
      title="Connexion QR">
      {phase === 'camera' ? (
        <View style={styles.cameraWrap}>
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            facing="back"
            onBarcodeScanned={({ data }) => handlePayload(data)}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : (
        <Text style={styles.hint}>
          {phase === 'waiting' ? 'En attente de confirmation sur l’ordinateur…' : message}
        </Text>
      )}
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
    cameraWrap: {
      height: 280,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.backgroundGrouped,
      marginVertical: spacing.sm,
    },
  }));
}
