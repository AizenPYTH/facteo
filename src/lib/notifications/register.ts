import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationKind =
  | 'invoice_overdue'
  | 'quote_accepted'
  | 'payment_received'
  | 'due_date_reminder';

export const NOTIFICATION_MESSAGES: Record<
  NotificationKind,
  { title: string; body: (context: string) => string }
> = {
  invoice_overdue: {
    title: 'Facture en retard',
    body: (context) => `La facture ${context} est en retard de paiement.`,
  },
  quote_accepted: {
    title: 'Devis accepté',
    body: (context) => `Le devis ${context} a été accepté.`,
  },
  payment_received: {
    title: 'Paiement reçu',
    body: (context) => `Un paiement a été reçu pour la facture ${context}.`,
  },
  due_date_reminder: {
    title: 'Échéance proche',
    body: (context) => `La facture ${context} arrive bientôt à échéance.`,
  },
};

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const expoPushToken = tokenResponse.data;

  const { error } = await supabase.from('push_device_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform: Platform.OS,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  );

  if (error) {
    logSupabaseError('registerForPushNotifications', error);
  }

  return expoPushToken;
}

export function addNotificationResponseListener(
  listener: (url: string) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;

    if (typeof url === 'string') {
      listener(url);
    }
  });
}

export async function scheduleLocalNotificationPreview(
  kind: NotificationKind,
  context: string,
): Promise<void> {
  const message = NOTIFICATION_MESSAGES[kind];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body(context),
      data: {
        url: Linking.createURL('/'),
      },
    },
    trigger: null,
  });
}
