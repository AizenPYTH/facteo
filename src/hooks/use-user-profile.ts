import { useAuth } from '@/hooks/use-auth';
import { resolveDashboardProfile } from '@/lib/supabase/dashboard';

export function useUserProfile() {
  const { user } = useAuth();

  return resolveDashboardProfile(null, user?.user_metadata ?? {});
}
