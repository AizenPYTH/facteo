import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT } from '@/lib/format/currency';
import { frenchDateInputToIso, todayFrenchDateInput } from '@/lib/format/date-input';
import {
  createEmptyPaymentForm,
  isPaymentAmountValid,
  parsePaymentAmount,
} from '@/lib/invoices/validators';

type PaymentModalProps = {
  visible: boolean;
  loading?: boolean;
  maxAmount: number;
  onCancel: () => void;
  onConfirm: (input: {
    amount: number;
    paidAt?: string;
    paymentMethod?: string;
    paymentReference?: string;
    notes?: string;
  }) => void;
};

export function PaymentModal({
  visible,
  loading = false,
  maxAmount,
  onCancel,
  onConfirm,
}: PaymentModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(createEmptyPaymentForm);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when modal opens
      setForm({
        ...createEmptyPaymentForm(),
        paidAt: todayFrenchDateInput(),
      });
      setAmountError(undefined);
      setDateError(undefined);
    }
  }, [visible]);

  function handleConfirm() {
    const amount = parsePaymentAmount(form.amount);

    if (!isPaymentAmountValid(amount, maxAmount)) {
      setAmountError(
        amount <= 0
          ? 'Saisissez un montant supérieur à 0.'
          : `Le montant ne peut pas dépasser ${formatPriceHT(maxAmount)}.`,
      );
      return;
    }

    const paidAtIso = frenchDateInputToIso(form.paidAt);

    if (!paidAtIso) {
      setDateError('Date de paiement invalide.');
      return;
    }

    onConfirm({
      amount,
      paidAt: paidAtIso,
      paymentMethod: form.paymentMethod.trim() || undefined,
      paymentReference: form.paymentReference.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onCancel} style={styles.overlay}>
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Text style={styles.title}>Enregistrer un paiement</Text>
          <Text style={styles.subtitle}>Reste à payer : {formatPriceHT(maxAmount)}</Text>

          <KeyboardAwareScrollView
            bottomOffset={spacing.xl}
            contentContainerStyle={styles.form}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}>
            <TextField
              error={amountError}
              keyboardType="decimal-pad"
              label="Montant"
              onChangeText={(amount) => {
                setForm((current) => ({ ...current, amount }));
                setAmountError(undefined);
              }}
              placeholder="0,00"
              value={form.amount}
            />
            <TextField
              error={dateError}
              label="Date du paiement"
              onChangeText={(paidAt) => {
                setForm((current) => ({ ...current, paidAt }));
                setDateError(undefined);
              }}
              placeholder="JJ/MM/AAAA"
              value={form.paidAt}
            />

            <CollapsibleSection title="Options avancées">
              <TextField
                label="Mode de paiement"
                onChangeText={(paymentMethod) =>
                  setForm((current) => ({ ...current, paymentMethod }))
                }
                placeholder="Virement, chèque, espèces..."
                value={form.paymentMethod}
              />
              <TextField
                label="Référence"
                onChangeText={(paymentReference) =>
                  setForm((current) => ({ ...current, paymentReference }))
                }
                placeholder="N° de transaction, chèque..."
                value={form.paymentReference}
              />
              <TextField
                label="Notes"
                multiline
                numberOfLines={3}
                onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
                placeholder="Informations complémentaires..."
                textAlignVertical="top"
                value={form.notes}
              />
            </CollapsibleSection>
          </KeyboardAwareScrollView>

          <View style={styles.actions}>
            <Button onPress={onCancel} title="Annuler" variant="ghost" />
            <Button loading={loading} onPress={handleConfirm} title="Enregistrer" />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '85%',
  },
  title: {
    ...typography.title3,
    color: colors.text,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
}));
}
