import { Text, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatFrenchPhoneDisplay } from '@/lib/format/phone';
import { fadeInUp } from '@/lib/motion/presets';
import type { Client } from '@/types/client';

import { ClientField } from './client-field';

export type ClientDetailViewProps = {
  client: Client;
  style?: ViewStyle;
};

function formatAddress(client: Client): string | null {
  const lines = [
    client.address?.trim(),
    [client.postalCode?.trim(), client.city?.trim()].filter(Boolean).join(' '),
    client.country?.trim(),
  ].filter(Boolean);

  return lines.length > 0 ? lines.join('\n') : null;
}

export function ClientDetailView({ client, style }: ClientDetailViewProps) {
  const styles = useStyles();
  const colors = useColors();
  const address = formatAddress(client);

  return (
    <View style={[styles.container, style]}>
      <Animated.View entering={fadeInUp({ index: 0 })} style={styles.section}>
        <Text style={styles.sectionTitle}>Identité</Text>
        <View style={styles.card}>
          <ClientField label="Nom" value={client.lastName} />
          <ClientField label="Prénom" value={client.firstName} />
          <ClientField label="Entreprise" value={client.company} />
        </View>
      </Animated.View>

      <Animated.View entering={fadeInUp({ index: 1 })} style={styles.section}>
        <Text style={styles.sectionTitle}>Coordonnées</Text>
        <View style={styles.card}>
          <ClientField label="Adresse e-mail" value={client.email} />
          <ClientField label="Téléphone" value={formatFrenchPhoneDisplay(client.phone)} />
        </View>
      </Animated.View>

      <Animated.View entering={fadeInUp({ index: 2 })} style={styles.section}>
        <Text style={styles.sectionTitle}>Adresse</Text>
        <View style={styles.card}>
          {address ? (
            <Text style={styles.addressText}>{address}</Text>
          ) : (
            <ClientField label="Adresse" value={null} />
          )}
        </View>
      </Animated.View>

      <Animated.View entering={fadeInUp({ index: 3 })} style={styles.section}>
        <Text style={styles.sectionTitle}>Facturation</Text>
        <View style={styles.card}>
          <ClientField label="SIREN" value={client.siren} />
          <ClientField label="SIRET" value={client.siret} />
          <ClientField label="Numéro de TVA" value={client.vatNumber} />
        </View>
      </Animated.View>

      {client.notes?.trim() ? (
        <Animated.View entering={fadeInUp({ index: 4 })} style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{client.notes.trim()}</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  addressText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
}));
}
