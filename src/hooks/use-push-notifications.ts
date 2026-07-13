import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';
import { addNotificationResponseListener, registerForPushNotifications } from '@/lib/notifications/register';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || Platform.OS === 'web') {
      return;
    }

    void registerForPushNotifications(user.id);
  }, [user?.id]);

  useEffect(() => {
    const subscription = addNotificationResponseListener((url) => {
      const path = Linking.parse(url).path;

      if (path) {
        router.push(`/${path}` as Href);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
