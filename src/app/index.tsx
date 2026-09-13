import { Redirect, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { useAuth } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Index() {
  const { user, loading } = useAuth();

  // Variables EXPO_PUBLIC_SUPABASE_* absentes du build : le client Supabase est un
  // placeholder et aucune requête n’aboutira. On le dit explicitement au lieu de
  // laisser l’utilisateur devant un écran de chargement sans fin.
  if (!isSupabaseConfigured) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Configuration serveur absente</Text>
        <Text style={styles.body}>
          Cette version d’INVEQ a été compilée sans les variables d’environnement
          EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY. Aucune connexion au
          serveur n’est possible. Installez une build corrigée.
        </Text>
      </View>
    );
  }

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Redirect href={'/(app)' as Href} />;
  }

  return <Redirect href={'/(auth)/login' as Href} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
});
