import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import {
  fetchNotificationPreferences,
  upsertNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/notifications/preferences';
import { notificationsQueryKeys } from '@/lib/supabase/query-keys';

export function useNotificationPreferences() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: notificationsQueryKeys.preferences(user?.id ?? 'anonymous'),
    queryFn: () => fetchNotificationPreferences(user!.id),
    enabled: Boolean(user?.id) && !authLoading,
  });
}

export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié.');
      }

      return upsertNotificationPreferences(user.id, preferences);
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.preferences(user.id) });
      }
    },
  });
}
