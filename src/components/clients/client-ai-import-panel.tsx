import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import {
  CLIENT_AI_IMPORT_EXAMPLE,
  CLIENT_PLACEHOLDERS,
} from '@/constants/client-placeholders';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { parseClientsWithAi } from '@/lib/ai/parse-clients';
import {
  countLikelyClientBlocks,
  detectClientFields,
  type DetectedClientHints,
} from '@/lib/clients/detect-client-fields';
import type { ParsedClientDraft } from '@/types/ai-client';

export type ClientAiImportPanelProps = {
  onParsed: (clients: ParsedClientDraft[]) => void;
  onCancel?: () => void;
};

function clientPreviewLabel(client: ParsedClientDraft): string {
  const person = [client.firstName, client.lastName].filter(Boolean).join(' ').trim();
  return client.company || person || client.email || 'Client';
}

function buildHintChips(hints: DetectedClientHints, blockCount: number): string[] {
  const chips: string[] = [];
  if (blockCount > 0) {
    chips.push(blockCount === 1 ? '1 bloc' : `${blockCount} blocs`);
  }
  if (hints.emails.length > 0) {
    chips.push(`${hints.emails.length} e-mail${hints.emails.length > 1 ? 's' : ''}`);
  }
  if (hints.phones.length > 0) {
    chips.push(`${hints.phones.length} tél.`);
  }
  if (hints.vatNumbers.length > 0) {
    chips.push('TVA');
  }
  if (hints.websites.length > 0) {
    chips.push('Site');
  }
  if (hints.sirens.length > 0 || hints.sirets.length > 0) {
    chips.push('SIREN/SIRET');
  }
  if (hints.postalCodes.length > 0) {
    chips.push('CP');
  }
  if (hints.ibans.length > 0) {
    chips.push('IBAN');
  }
  return chips;
}

export function ClientAiImportPanel({ onParsed, onCancel }: ClientAiImportPanelProps) {
  const styles = useStyles();
  const colors = useColors();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedClients, setParsedClients] = useState<ParsedClientDraft[] | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);

  const hints = useMemo(() => detectClientFields(text), [text]);
  const blockCount = useMemo(() => countLikelyClientBlocks(text), [text]);
  const chips = useMemo(() => buildHintChips(hints, blockCount), [hints, blockCount]);

  const ambiguities = useMemo(() => {
    if (!parsedClients) {
      return [];
    }
    return parsedClients.flatMap((client, index) =>
      client.ambiguities.map((item) => ({
        ...item,
        clientLabel: clientPreviewLabel(client),
        clientIndex: index,
      })),
    );
  }, [parsedClients]);

  function handleUseExample() {
    setText(CLIENT_AI_IMPORT_EXAMPLE);
    setParsedClients(null);
    setSelectedIndexes(new Set());
    setWarnings([]);
    setError(null);
  }

  async function handleAnalyze() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Collez un texte client (carte de visite, e-mail, signature…).');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setParsedClients(null);
    setSelectedIndexes(new Set());
    setWarnings([]);

    try {
      const result = await parseClientsWithAi({ text: trimmed });
      const clients = result.clients;

      if (clients.length === 0) {
        setError('Aucun client détecté. Enrichissez le texte ou réessayez.');
        setWarnings(result.warnings);
        return;
      }

      setWarnings(result.warnings);
      setParsedClients(clients);

      if (clients.length === 1) {
        onParsed(clients);
        return;
      }

      setSelectedIndexes(new Set(clients.map((_, index) => index)));
    } catch (analyzeError) {
      const message =
        analyzeError instanceof Error && analyzeError.message.trim()
          ? analyzeError.message
          : 'Analyse IA indisponible. Réessayez dans quelques instants.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function toggleIndex(index: number) {
    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (!parsedClients) {
      return;
    }
    setSelectedIndexes(new Set(parsedClients.map((_, index) => index)));
  }

  function handleConfirmBatch() {
    if (!parsedClients) {
      return;
    }
    const selected = parsedClients.filter((_, index) => selectedIndexes.has(index));
    if (selected.length === 0) {
      setError('Sélectionnez au moins un client.');
      return;
    }
    onParsed(selected);
  }

  return (
    <View style={styles.panel}>
      <View style={styles.intro}>
        <Text style={styles.title}>Ajouter par IA</Text>
        <Text style={styles.subtitle}>
          Collez une carte de visite, une signature e-mail ou une fiche — on préremplit le
          formulaire.
        </Text>
      </View>

      <TextField
        accessibilityLabel="Texte client à analyser"
        multiline
        numberOfLines={8}
        onChangeText={(value) => {
          setText(value);
          setError(null);
        }}
        placeholder={`Ex. ${CLIENT_PLACEHOLDERS.company}\n${CLIENT_PLACEHOLDERS.address}\n${CLIENT_PLACEHOLDERS.postalCode} ${CLIENT_PLACEHOLDERS.city}\n${CLIENT_PLACEHOLDERS.email}`}
        style={styles.textArea}
        textAlignVertical="top"
        value={text}
      />

      <View style={styles.actionsRow}>
        <Button onPress={handleUseExample} title="Utiliser un exemple" variant="ghost" />
      </View>

      {chips.length > 0 ? (
        <View style={styles.chipsRow}>
          {chips.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipLabel}>{chip}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.hintIdle}>Détection live dès que vous collez du texte.</Text>
      )}

      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {warnings.length > 0 ? (
        <View style={styles.warnings}>
          {warnings.map((warning) => (
            <Text key={warning} style={styles.warningText}>
              {warning}
            </Text>
          ))}
        </View>
      ) : null}

      <Button
        elevated
        loading={isAnalyzing}
        onPress={() => {
          void handleAnalyze();
        }}
        title="Analyser"
      />

      {parsedClients && parsedClients.length > 1 ? (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>
            {parsedClients.length} clients détectés
          </Text>
          <View style={styles.previewList}>
            {parsedClients.map((client, index) => {
              const selected = selectedIndexes.has(index);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  key={`${clientPreviewLabel(client)}-${index}`}
                  onPress={() => toggleIndex(index)}
                  style={[styles.previewItem, selected && styles.previewItemSelected]}>
                  <View
                    style={[
                      styles.checkbox,
                      selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}>
                    {selected ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>
                  <View style={styles.previewItemBody}>
                    <Text style={styles.previewItemTitle}>{clientPreviewLabel(client)}</Text>
                    <Text numberOfLines={1} style={styles.previewItemMeta}>
                      {[client.email, client.phone, client.city].filter(Boolean).join(' · ') ||
                        'À compléter'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.batchActions}>
            <Button onPress={handleSelectAll} title="Tout sélectionner" variant="ghost" />
            <Button
              elevated
              onPress={handleConfirmBatch}
              title={`Confirmer (${selectedIndexes.size})`}
            />
          </View>
        </View>
      ) : null}

      {parsedClients && parsedClients.length === 1 ? (
        <Text style={styles.singleHint}>1 client détecté — formulaire prérempli.</Text>
      ) : null}

      {ambiguities.length > 0 ? (
        <View style={styles.ambiguities}>
          <Text style={styles.ambiguitiesTitle}>Points à vérifier</Text>
          {ambiguities.map((item, index) => (
            <Text key={`${item.field}-${index}`} style={styles.ambiguityItem}>
              {parsedClients && parsedClients.length > 1
                ? `${item.clientLabel} — ${item.message}`
                : item.message}
            </Text>
          ))}
        </View>
      ) : null}

      {onCancel ? (
        <Button onPress={onCancel} title="Saisie manuelle" variant="ghost" />
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    panel: {
      gap: spacing.md,
    },
    intro: {
      gap: spacing.xs,
    },
    title: {
      ...typography.headline,
      color: colors.text,
    },
    subtitle: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    textArea: {
      minHeight: 160,
    },
    actionsRow: {
      alignItems: 'flex-start',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      borderRadius: radius.chip,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chipLabel: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
    hintIdle: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    error: {
      ...typography.footnote,
      color: colors.error,
    },
    warnings: {
      gap: spacing.xs,
    },
    warningText: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    preview: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    previewTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    previewList: {
      gap: spacing.xs,
    },
    previewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    previewItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.xs,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxMark: {
      ...typography.footnoteMedium,
      color: colors.onPrimary,
      fontSize: 12,
      lineHeight: 14,
    },
    previewItemBody: {
      flex: 1,
      gap: 2,
    },
    previewItemTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    previewItemMeta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    batchActions: {
      gap: spacing.sm,
    },
    singleHint: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    ambiguities: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ambiguitiesTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    ambiguityItem: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
  }));
}
