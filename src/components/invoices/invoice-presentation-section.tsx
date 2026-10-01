import { ScrollView, Switch, Text, View } from 'react-native';

import { FilterChip } from '@/components/ui/filter-chip';
import { TextField } from '@/components/ui/text-field';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { PDF_TEMPLATES } from '@/lib/pdf/engine/templates/registry';
import {
  DEFAULT_INVOICE_TITLE,
  formatIssuerLegalIds,
  INVOICE_TITLE_SUGGESTIONS,
  ISSUER_LEGAL_ID_LABELS,
  ISSUER_LEGAL_IDS,
  STAMP_COLOR_LABELS,
  STAMP_COLORS,
  STAMP_POSITION_LABELS,
  STAMP_POSITIONS,
  type InvoicePdfOptions,
  type IssuerLegalId,
} from '@/types/pdf-options';

type InvoicePresentationSectionProps = {
  value: InvoicePdfOptions;
  onChange: (value: InvoicePdfOptions) => void;
  /** SIRET et TVA de l'entreprise, montrés à côté des cases. */
  company: { siret?: string | null; vatNumber?: string | null } | null;
  /** Création uniquement : numéro libre (vide = automatique). */
  number?: string;
  onNumberChange?: (value: string) => void;
  forecastNumber?: string | null;
  /** Le modèle se change ailleurs (galerie) sur une facture existante. */
  showTemplate?: boolean;
};

/**
 * Présentation de la facture, identique au site : numéro, titre, modèle,
 * SIREN / SIRET / TVA en tête, e-mail, tampon « Facture payée ».
 */
export function InvoicePresentationSection({
  value,
  onChange,
  company,
  number,
  onNumberChange,
  forecastNumber,
  showTemplate = true,
}: InvoicePresentationSectionProps) {
  const styles = useStyles();
  const colors = useColors();
  const legalValues = formatIssuerLegalIds(company?.siret, company?.vatNumber);
  const activeTitle = value.title?.trim() || DEFAULT_INVOICE_TITLE;

  function toggleLegalId(id: IssuerLegalId) {
    const legalIds = value.legalIds.includes(id)
      ? value.legalIds.filter((entry) => entry !== id)
      : ISSUER_LEGAL_IDS.filter((entry) => entry === id || value.legalIds.includes(entry));
    onChange({ ...value, legalIds });
  }

  return (
    <View style={styles.card}>
      {onNumberChange ? (
        <TextField
          autoCapitalize="characters"
          hint="Laissez vide pour le numéro automatique. Chaque numéro ne peut servir qu’une fois."
          label="Numéro de la facture"
          maxLength={40}
          onChangeText={onNumberChange}
          placeholder={forecastNumber ?? 'Automatique'}
          value={number ?? ''}
        />
      ) : null}

      <View style={styles.group}>
        <TextField
          label="Titre du document"
          maxLength={60}
          onChangeText={(title) => onChange({ ...value, title })}
          placeholder={DEFAULT_INVOICE_TITLE}
          value={value.title ?? ''}
        />
        <ChipRow>
          {INVOICE_TITLE_SUGGESTIONS.map((suggestion) => (
            <FilterChip
              key={suggestion}
              label={suggestion}
              onPress={() =>
                onChange({ ...value, title: suggestion === DEFAULT_INVOICE_TITLE ? null : suggestion })
              }
              selected={activeTitle === suggestion}
            />
          ))}
        </ChipRow>
      </View>

      {showTemplate ? (
        <View style={styles.group}>
          <Text style={styles.label}>Modèle</Text>
          <ChipRow>
            {PDF_TEMPLATES.map((template) => (
              <FilterChip
                key={template.id}
                label={`${template.id} · ${template.name}`}
                onPress={() => onChange({ ...value, templateId: template.id })}
                selected={value.templateId === template.id}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}

      <View style={styles.group}>
        <Text style={styles.label}>En tête de la facture</Text>
        {ISSUER_LEGAL_IDS.map((id) => {
          const shown = legalValues[id];
          const checked = value.legalIds.includes(id);

          return (
            <View key={id} style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>{ISSUER_LEGAL_ID_LABELS[id]}</Text>
                <Text style={[styles.switchValue, !shown && styles.missing]}>
                  {shown ?? 'Non renseigné (page Entreprise)'}
                </Text>
              </View>
              <Switch
                accessibilityLabel={`Afficher ${ISSUER_LEGAL_ID_LABELS[id]}`}
                onValueChange={() => toggleLegalId(id)}
                trackColor={{ true: colors.primary }}
                value={checked}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.switchRow}>
        <Text style={[styles.switchTitle, styles.switchText]}>Afficher mon e-mail sur la facture</Text>
        <Switch
          onValueChange={(showEmail) => onChange({ ...value, showEmail })}
          trackColor={{ true: colors.primary }}
          value={value.showEmail}
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Tampon « Facture payée » : couleur</Text>
        <ChipRow>
          {STAMP_COLORS.map((color) => (
            <FilterChip
              key={color}
              label={STAMP_COLOR_LABELS[color]}
              onPress={() => onChange({ ...value, stampColor: color })}
              selected={value.stampColor === color}
            />
          ))}
        </ChipRow>
        <Text style={styles.label}>Emplacement</Text>
        <ChipRow>
          {STAMP_POSITIONS.map((position) => (
            <FilterChip
              key={position}
              label={STAMP_POSITION_LABELS[position]}
              onPress={() => onChange({ ...value, stampPosition: position })}
              selected={value.stampPosition === position}
            />
          ))}
        </ChipRow>
        <Text style={styles.hint}>Le tampon apparaît dès que la facture est payée.</Text>
      </View>
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  const styles = useStyles();

  return (
    <ScrollView
      contentContainerStyle={styles.chipRow}
      horizontal
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.lg,
    },
    group: {
      gap: spacing.sm,
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing[1],
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      minHeight: 44,
    },
    switchText: {
      flex: 1,
    },
    switchTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    switchValue: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    missing: {
      color: colors.error,
    },
    hint: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  }));
}
