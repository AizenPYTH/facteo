import { notFound } from 'next/navigation';

import { ActivityDashboard } from '@/components/app/admin/activity-dashboard';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Activité utilisateurs',
  robots: { index: false, follow: false },
};

/**
 * Espace administrateur. Contrôle côté serveur (session de l'utilisateur,
 * jamais la clé service_role) : tout autre compte reçoit une page 404. Les
 * données elles-mêmes ne sont servies qu'aux administrateurs, vérifiés en base
 * par chaque fonction admin_*.
 */
export default async function AdminActivityPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: isAdmin, error } = await supabase.rpc('is_platform_admin');
  if (error || isAdmin !== true) {
    notFound();
  }

  return <ActivityDashboard />;
}
