import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useTenant } from '@/hooks/use-tenant';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT } from '@/lib/format/currency';
import { supabase } from '@/lib/supabase';
import { syncSuperPdp } from '@/lib/superpdp/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/toast-provider';

type ReceivedInvoice = {
  id: string;
  supplier_name: string | null;
  invoice_number: string | null;
  issue_date: string | null;
  subtotal_ht: number | null;
  total_vat: number | null;
  total_ttc: number | null;
  electronic_invoice_status: string | null;
  received_at: string | null;
  latest_status_code: string | null;
};

export default function ReceivedEInvoicesScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { companyId } = useTenant();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<ReceivedInvoice[]>([]);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('superpdp_received_invoices')
      .select(
        'id, supplier_name, invoice_number, issue_date, subtotal_ht, total_vat, total_ttc, electronic_invoice_status, received_at, latest_status_code',
      )
      .eq('company_id', companyId)
      .order('received_at', { ascending: false })
      .limit(100);
    if (error) showError('Impossible de charger les factures reçues.');
    setRows((data as ReceivedInvoice[]) ?? []);
    setLoading(false);
  }, [companyId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSync() {
    if (!companyId) return;
    setBusy(true);
    try {
      await syncSuperPdp(companyId, 'in');
      showSuccess('Factures reçues synchronisées.');
      await load();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Sync impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsScreenFrame title="Factures reçues">
      <View style={styles.header}>
        <Text style={styles.lead}>
          Factures électroniques reçues via SUPER PDP. Elles ne sont jamais marquées comme payées
          automatiquement.
        </Text>
        <Button
          disabled={busy || !companyId}
          title={busy ? 'Synchronisation…' : 'Synchroniser'}
          onPress={() => void handleSync()}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={rows}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucune facture reçue pour le moment.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.supplier_name || 'Fournisseur'}</Text>
              <Text style={styles.meta}>N° {item.invoice_number || '—'}</Text>
              <Text style={styles.meta}>Date {item.issue_date || '—'}</Text>
              <Text style={styles.meta}>
                HT {formatPriceHT(item.subtotal_ht ?? 0)} · TVA {formatPriceHT(item.total_vat ?? 0)} ·
                TTC {formatPriceHT(item.total_ttc ?? 0)}
              </Text>
              <Text style={styles.meta}>
                Statut {item.electronic_invoice_status || '—'}
                {item.latest_status_code ? ` (${item.latest_status_code})` : ''}
              </Text>
              <Text style={styles.meta}>
                Réception{' '}
                {item.received_at ? new Date(item.received_at).toLocaleString('fr-FR') : '—'}
              </Text>
              <Text style={styles.hint}>
                Import achats : non disponible (module achats absent d’INVEQ).
              </Text>
            </View>
          )}
        />
      )}
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((c) =>
    StyleSheet.create({
      header: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.md,
      },
      lead: {
        ...typography.body,
        color: c.textSecondary,
      },
      list: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.sm,
      },
      card: {
        backgroundColor: c.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.border,
      },
      title: {
        ...typography.subheadline,
        color: c.text,
        marginBottom: spacing.xs,
      },
      meta: {
        ...typography.body,
        color: c.textSecondary,
        marginBottom: 2,
      },
      hint: {
        ...typography.caption1,
        color: c.textSecondary,
        marginTop: spacing.sm,
      },
      empty: {
        ...typography.body,
        color: c.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xl,
      },
    }),
  );
}
