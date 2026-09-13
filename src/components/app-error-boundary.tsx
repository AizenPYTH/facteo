import * as SplashScreen from 'expo-splash-screen';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

/**
 * Empêche une exception JS non gérée de tuer le process iOS
 * (sortie immédiate au splash, sans écran d’erreur).
 *
 * Le splash natif est masqué ici, et pas seulement dans SplashScreenController :
 * ce dernier est un enfant de cette boundary, donc il est démonté avant d’avoir
 * pu appeler hideAsync() dès qu’une erreur remonte. Sans cet appel, l’écran de
 * secours s’affiche derrière le splash, l’app paraît figée et le watchdog iOS
 * la tue — un crash JS devient indiscernable d’un crash natif.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, message: error?.message ?? null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Toujours révéler l’écran de secours, même si le splash était encore affiché.
    SplashScreen.hideAsync().catch(() => {
      // Déjà masqué, ou module indisponible : sans conséquence ici.
    });

    console.error('AppErrorBoundary', error.message, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.root}>
        <Text style={styles.title}>INVEQ a rencontré un problème</Text>
        <Text style={styles.body}>
          Fermez complètement l’application puis rouvrez-la. Si le problème continue, installez
          la dernière version TestFlight.
        </Text>

        {this.state.message ? (
          <ScrollView style={styles.detailBox} contentContainerStyle={styles.detailContent}>
            <Text selectable style={styles.detail}>
              {this.state.message}
            </Text>
          </ScrollView>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ hasError: false, message: null })}
          style={styles.button}>
          <Text style={styles.buttonLabel}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }
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
  detailBox: {
    maxHeight: 160,
    alignSelf: 'stretch',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  detailContent: {
    padding: 12,
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  button: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
