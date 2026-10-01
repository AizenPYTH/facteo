import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, Switch, Text, View } from 'react-native';

import { InvoicePresentationSection } from '@/components/invoices/invoice-presentation-section';
import { InvoiceScreenHeader } from '@/components/invoices/invoice-screen-header';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { FilterChip } from '@/components/ui/filter-chip';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useSettings } from '@/hooks/use-settings';
import { useTenant } from '@/hooks/use-tenant';
import {
  analyzeInvoicesImage,
  toInvoiceLineValues,
  type AnalyzedInvoice,
} from '@/lib/ai/invoices-image-analysis';
import { calculateLineTotals } from '@/lib/calculations/totals';
import { formatPriceHT } from '@/lib/format/currency';
import { frenchDateInputToIso, todayFrenchDateInput } from '@/lib/format/date-input';
import { createClient, fetchClientsPage } from '@/lib/supabase/clients';
import { createInvoice, markInvoiceAsPaid } from '@/lib/supabase/invoices';
import { clientsQueryKeys, invoicesQueryKeys } from '@/lib/supabase/query-keys';
import { requireScope } from '@/lib/tenant/scope';
import { useToast } from '@/providers/toast-provider';
import { createEmptyClientFormValues, getClientDisplayName, type Client } from '@/types/client';
import { createLocalInvoiceLineId, type InvoiceLineValue } from '@/types/invoice';
import {
  createDefaultInvoicePdfOptions,
  readRememberedLegalIds,
  type InvoicePdfOptions,
} from '@/types/pdf-options';

/** « Nouveau client » : créé à l'enregistrement avec le nom lu sur la capture. */
const NEW_CLIENT = '__new__';

type Draft = {
  key: string;
  detectedClient: string;
  clientAddress: string;
  clientChoice: string;
  issuedAt: string;
  paid: boolean;
  number: string;
  pdfOptions: InvoicePdfOptions;
  lines: InvoiceLineValue[];
  error: string | null;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function matchClient(clients: Client[], name: string): string {
  const target = normalize(name);
  if (!target) return '';
  const found = clients.find((client) =>
    [getClientDisplayName(client), client.company ?? '', `${client.firstName} ${client.lastName}`]
      .map(normalize)
      .some((candidate) => candidate && candidate === target),
  );
  return found?.id ?? NEW_CLIENT;
}

/** AAAA-MM-JJ (lu sur la capture) → JJ/MM/AAAA (saisie de l'app). */
function isoDateToFrenchInput(value: string | null): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : todayFrenchDateInput();
}

function lineTotalTtc(line: InvoiceLineValue): number {
  const toNumber = (value: string) => Number(value.replace(',', '.')) || 0;
  return calculateLineTotals(
    toNumber(line.quantity),
    toNumber(line.unitPrice),
    toNumber(line.vatRate),
    toNumber(line.discountPercent),
  ).lineTotalTtc;
}

/**
 * Une capture → plusieurs factures. L'IA recopie ; tout se vérifie et se
 * corrige ici avant l'enregistrement, facture par facture.
 */
export function InvoiceBatchScreen() {
  const styles = useStyles();
  const colors = useColors();
  const queryClient = useQueryClient();
  const { scope } = useTenant();
  const { data: settings } = useSettings();
  const { data: companyProfile } = useCompanyProfile();
  const { showError, showSuccess } = useToast();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const clientsQuery = useQuery({
    queryKey: [...clientsQueryKeys.all, 'batch', scope?.companyId],
    queryFn: () => fetchClientsPage(requireScope(scope), { page: 0, pageSize: 200 }),
    enabled: Boolean(scope),
  });
  const clients = clientsQuery.data?.clients ?? [];

  function toDraft(invoice: AnalyzedInvoice, index: number, legalIds: InvoicePdfOptions['legalIds']): Draft {
    return {
      key: `${Date.now()}-${index}`,
      detectedClient: invoice.client_name,
      clientAddress: invoice.client_address,
      clientChoice: matchClient(clients, invoice.client_name),
      issuedAt: isoDateToFrenchInput(invoice.issued_date),
      paid: false,
      number: '',
      pdfOptions: {
        ...createDefaultInvoicePdfOptions(),
        legalIds,
        templateId: settings?.invoiceTemplateId ?? null,
      },
      lines: invoice.lines.map((line) => ({
        ...toInvoiceLineValues(line),
        id: createLocalInvoiceLineId(),
        productId: null,
        discountPercent: '0',
      })),
      error: null,
    };
  }

  async function pickAndAnalyze(source: 'camera' | 'gallery') {
    if (analyzing) return;
    try {
      if (Platform.OS !== 'web') {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showError('Permission refusée pour accéder aux images.');
          return;
        }
      }

      const options = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.9, base64: true };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.canceled ? null : result.assets[0];
      if (!asset?.base64) return;

      setAnalyzing(true);
      const [invoices, legalIds] = await Promise.all([
        analyzeInvoicesImage({ imageBase64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' }),
        readRememberedLegalIds(),
      ]);
      if (invoices.length === 0) {
        throw new Error('Aucune facture reconnue sur cette image.');
      }
      setDrafts((current) => [...current, ...invoices.map((entry, i) => toDraft(entry, i, legalIds))]);
      showSuccess(
        `${invoices.length} facture${invoices.length > 1 ? 's' : ''} détectée${invoices.length > 1 ? 's' : ''}. Vérifiez puis enregistrez.`,
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Analyse impossible.');
    } finally {
      setAnalyzing(false);
    }
  }

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }

  function updateLine(key: string, lineId: string, patch: Partial<InvoiceLineValue>) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key
          ? { ...draft, lines: draft.lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line)) }
          : draft,
      ),
    );
  }

  async function saveAll() {
    const activeScope = requireScope(scope);
    setSaving(true);
    const remaining: Draft[] = [];
    let created = 0;

    for (const draft of drafts) {
      try {
        const lines = draft.lines.filter((line) => line.title.trim() || line.description.trim());
        if (lines.length === 0) throw new Error('Aucune ligne.');

        let clientId = draft.clientChoice;
        if (clientId === NEW_CLIENT) {
          const name = draft.detectedClient.trim();
          if (!name) throw new Error('Choisissez un client.');
          const client = await createClient(activeScope, {
            ...createEmptyClientFormValues(),
            lastName: name,
            address: draft.clientAddress,
          });
          clientId = client.id;
        }
        if (!clientId) throw new Error('Choisissez un client.');

        const issuedAtIso = frenchDateInputToIso(draft.issuedAt);
        if (!issuedAtIso) throw new Error('Date d’émission invalide (JJ/MM/AAAA).');

        const invoice = await createInvoice(activeScope, {
          clientId,
          lines,
          issuedAt: issuedAtIso,
          number: draft.number.trim() || null,
          pdfOptions: draft.pdfOptions,
        });
        if (draft.paid) {
          await markInvoiceAsPaid(activeScope, invoice.id);
        }
        created += 1;
      } catch (error) {
        remaining.push({
          ...draft,
          error: error instanceof Error ? error.message : 'Enregistrement impossible.',
        });
      }
    }

    setSaving(false);
    void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });

    if (created > 0) {
      showSuccess(`${created} facture${created > 1 ? 's' : ''} enregistrée${created > 1 ? 's' : ''}.`);
    }
    if (remaining.length === 0) {
      router.replace('/invoices' as Href);
      return;
    }
    setDrafts(remaining);
    showError(`${remaining.length} facture${remaining.length > 1 ? 's' : ''} à corriger (en rouge).`);
  }

  return (
    <FormScreen
      footer={
        drafts.length > 0 ? (
          <Button
            loading={saving}
            onPress={() => void saveAll()}
            title={drafts.length > 1 ? `Enregistrer les ${drafts.length} factures` : 'Enregistrer la facture'}
          />
        ) : undefined
      }
      header={<InvoiceScreenHeader title="Plusieurs factures (IA)" />}>
      <View style={styles.container}>
        <Text style={styles.intro}>
          Prenez en photo ou choisissez une capture : l’IA recopie chaque commande en facture, sans rien
          calculer. Vérifiez, corrigez, puis enregistrez tout d’un coup.
        </Text>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              loading={analyzing}
              onPress={() => void pickAndAnalyze('gallery')}
              title="Choisir une capture"
            />
          </View>
          <View style={styles.flex}>
            <Button onPress={() => void pickAndAnalyze('camera')} title="Photo" variant="ghost" />
          </View>
        </View>

        {drafts.map((draft, index) => {
          const total = draft.lines.reduce((sum, line) => sum + lineTotalTtc(line), 0);

          return (
            <View key={draft.key} style={[styles.card, draft.error ? styles.cardError : null]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Facture {index + 1}
                  {draft.detectedClient ? ` · ${draft.detectedClient}` : ''}
                </Text>
                <Text style={styles.total}>{formatPriceHT(total)} TTC</Text>
              </View>
              {draft.error ? <Text style={styles.errorText}>{draft.error}</Text> : null}

              <Text style={styles.label}>Client</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {draft.detectedClient ? (
                  <FilterChip
                    label={`+ Créer « ${draft.detectedClient} »`}
                    onPress={() => update(draft.key, { clientChoice: NEW_CLIENT, error: null })}
                    selected={draft.clientChoice === NEW_CLIENT}
                  />
                ) : null}
                {clients.map((client) => (
                  <FilterChip
                    key={client.id}
                    label={getClientDisplayName(client)}
                    onPress={() => update(draft.key, { clientChoice: client.id, error: null })}
                    selected={draft.clientChoice === client.id}
                  />
                ))}
              </ScrollView>

              <TextField
                label="Date d’émission"
                onChangeText={(issuedAt) => update(draft.key, { issuedAt })}
                placeholder="JJ/MM/AAAA"
                value={draft.issuedAt}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Déjà payée (tampon)</Text>
                <Switch
                  onValueChange={(paid) => update(draft.key, { paid })}
                  trackColor={{ true: colors.primary }}
                  value={draft.paid}
                />
              </View>

              <Text style={styles.label}>Lignes</Text>
              {draft.lines.map((line) => (
                <View key={line.id} style={styles.line}>
                  <TextField
                    label="Désignation"
                    onChangeText={(title) => updateLine(draft.key, line.id, { title })}
                    value={line.title || line.description}
                  />
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <TextField
                        keyboardType="decimal-pad"
                        label="Qté"
                        onChangeText={(quantity) => updateLine(draft.key, line.id, { quantity })}
                        value={line.quantity}
                      />
                    </View>
                    <View style={styles.flex}>
                      <TextField
                        keyboardType="decimal-pad"
                        label="P.U. HT"
                        onChangeText={(unitPrice) => updateLine(draft.key, line.id, { unitPrice })}
                        value={line.unitPrice}
                      />
                    </View>
                    <View style={styles.flex}>
                      <TextField
                        keyboardType="decimal-pad"
                        label="TVA %"
                        onChangeText={(vatRate) => updateLine(draft.key, line.id, { vatRate })}
                        value={line.vatRate}
                      />
                    </View>
                  </View>
                  <Button
                    onPress={() =>
                      update(draft.key, { lines: draft.lines.filter((entry) => entry.id !== line.id) })
                    }
                    title="Supprimer la ligne"
                    variant="ghost"
                  />
                </View>
              ))}

              <CollapsibleSection title="Numéro, titre, modèle, SIREN, tampon">
                <InvoicePresentationSection
                  company={companyProfile ?? null}
                  number={draft.number}
                  onChange={(pdfOptions) => update(draft.key, { pdfOptions })}
                  onNumberChange={(number) => update(draft.key, { number, error: null })}
                  value={draft.pdfOptions}
                />
              </CollapsibleSection>

              <Button
                onPress={() => setDrafts((current) => current.filter((entry) => entry.key !== draft.key))}
                title="Retirer cette facture"
                variant="ghost"
              />
            </View>
          );
        })}
      </View>
    </FormScreen>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.lg,
      paddingBottom: spacing.lg,
    },
    intro: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    flex: {
      flex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    cardError: {
      borderColor: colors.error,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    cardTitle: {
      ...typography.headline,
      color: colors.text,
      flex: 1,
    },
    total: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    errorText: {
      ...typography.footnote,
      color: colors.error,
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    chips: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    switchLabel: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    line: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  }));
}
