import { useRef, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';

import { ComposerIcon, GroupCard, SectionHeader } from '@/components/composer/primitives';
import {
  composerRadius,
  tabularNums,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { isValidIban } from '@/lib/payments/sepa-qr';
import {
  PAYMENT_MENTION_PRESETS,
  isValidBic,
  matchPaymentMentionPreset,
  normalizeBankValue,
  paymentMentionDays,
  resolveInvoiceBankDetails,
  withPaymentMentionDays,
  type InvoiceBankDetails,
  type InvoicePdfOptions,
  type PaymentMentionPresetId,
} from '@/types/pdf-options';

type MentionMode = 'none' | PaymentMentionPresetId | 'custom';

/** « FR7630004000… » → « FR76 3000 4000 … » : lisible pendant la relecture. */
function groupByFour(value: string): string {
  return normalizeBankValue(value).replace(/(.{4})(?=.)/g, '$1 ');
}

function initialMode(text: string | null): MentionMode {
  if (!text) return 'none';
  return matchPaymentMentionPreset(text) ?? 'custom';
}

type ComposerPaymentSectionProps = {
  value: InvoicePdfOptions;
  onChange: (value: InvoicePdfOptions) => void;
  /** IBAN et BIC de l'entreprise, repris tant que la facture n'en porte pas. */
  company: { iban?: string | null; bic?: string | null } | null;
  /** Délai de la facture en jours (0 : à réception), `null` si inconnu. */
  paymentDays: number | null;
  /** Facture soldée : le PDF n'imprime pas les coordonnées bancaires. */
  paid?: boolean;
  /** Création : proposer de garder ces coordonnées pour les factures suivantes. */
  saveAsDefault?: boolean;
  onSaveAsDefaultChange?: (value: boolean) => void;
  /** Première section de l'écran : pas d'espace au-dessus. */
  first?: boolean;
};

/**
 * « Paiement et mentions », imprimés en bas de la facture : coordonnées
 * bancaires (préremplies depuis l'entreprise) et mention de paiement, au choix
 * parmi les mentions prêtes à l'emploi, en texte libre, ou aucune.
 */
export function ComposerPaymentSection({
  value,
  onChange,
  company,
  paymentDays,
  paid = false,
  saveAsDefault = false,
  onSaveAsDefaultChange,
  first = false,
}: ComposerPaymentSectionProps) {
  const styles = useComposerStyles(paymentStyles);
  const colors = useComposerColors();
  const bank = resolveInvoiceBankDetails(value.bank, company);
  // `null` tant que l'utilisateur n'y a pas touché : le champ suit la valeur
  // imprimée, y compris une entreprise ou une mention chargées après coup.
  const [ibanDraft, setIbanDraft] = useState<string | null>(null);
  const [bicDraft, setBicDraft] = useState<string | null>(null);
  const [modeChoice, setModeChoice] = useState<MentionMode | null>(null);
  const [customDraft, setCustomDraft] = useState<string | null>(null);
  const bicRef = useRef<TextInput>(null);

  const text = value.paymentMention ?? '';
  const savedMode = initialMode(value.paymentMention);
  const mode = modeChoice ?? savedMode;
  const customText = customDraft ?? (savedMode === 'custom' ? text : '');
  const ibanShown = ibanDraft ?? groupByFour(bank.iban);
  const bicShown = bicDraft ?? bank.bic;

  function setBank(next: Partial<InvoiceBankDetails>) {
    onChange({ ...value, bank: { ...bank, ...next } });
  }

  function setMention(next: string | null) {
    onChange({ ...value, paymentMention: next && next.trim() ? next : null });
  }

  function chooseMode(next: MentionMode) {
    if (next === mode) return;
    void triggerSelectionHaptic();
    setModeChoice(next);
    if (next === 'none') {
      setMention(null);
    } else if (next === 'custom') {
      setMention(customText);
    } else {
      setMention(PAYMENT_MENTION_PRESETS.find((preset) => preset.id === next)?.text ?? null);
    }
  }

  function editMention(next: string) {
    const stillPreset = mode !== 'custom' && matchPaymentMentionPreset(next) === mode;
    if (!stillPreset) {
      // Le texte d'une mention prête à l'emploi a été réécrit : il devient libre.
      setModeChoice('custom');
      setCustomDraft(next);
    }
    setMention(next);
  }

  const iban = normalizeBankValue(bank.iban);
  const bic = normalizeBankValue(bank.bic);
  const ibanError = bank.show && iban.length > 0 && !isValidIban(iban);
  const bicError = bank.show && bic.length > 0 && !isValidBic(bic);
  const companyIban = normalizeBankValue(company?.iban);
  const companyBic = normalizeBankValue(company?.bic);
  const canSaveAsDefault =
    Boolean(onSaveAsDefaultChange) &&
    bank.show &&
    isValidIban(iban) &&
    (iban !== companyIban || bic !== companyBic);

  const mentionDays = mode === 'none' ? null : paymentMentionDays(text);
  const mismatch =
    !paid && paymentDays !== null && mentionDays !== null && mentionDays !== paymentDays;

  return (
    <>
      <SectionHeader first={first} title="Coordonnées bancaires" />
      <GroupCard>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text maxFontSizeMultiplier={1.4} style={styles.rowTitle}>
              Afficher l’IBAN et le BIC
            </Text>
            <Text maxFontSizeMultiplier={1.4} style={styles.rowSubtitle}>
              Avec le QR code de virement, pour être payé plus vite.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Afficher l’IBAN et le BIC sur la facture"
            ios_backgroundColor={colors.track}
            onValueChange={(show) => setBank({ show })}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.track, true: colors.ok }}
            value={bank.show}
          />
        </View>

        {bank.show ? (
          <View style={styles.fieldBlock}>
            <Text maxFontSizeMultiplier={1.4} style={styles.caption}>
              IBAN
            </Text>
            <TextInput
              accessibilityLabel="IBAN"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              maxLength={42}
              onBlur={() => setIbanDraft(groupByFour(ibanShown))}
              onChangeText={(next) => {
                setIbanDraft(next);
                setBank({ iban: normalizeBankValue(next) });
              }}
              onSubmitEditing={() => bicRef.current?.focus()}
              placeholder="FR76 3000 4000 0312 3456 7890 143"
              placeholderTextColor={colors.ink3}
              returnKeyType="next"
              spellCheck={false}
              style={[styles.input, ibanError && styles.inputError]}
              submitBehavior="submit"
              textContentType="none"
              value={ibanShown}
            />
            {ibanError ? (
              <Text maxFontSizeMultiplier={1.4} style={styles.error}>
                IBAN incomplet ou erroné : vérifiez les chiffres.
              </Text>
            ) : null}

            <Text maxFontSizeMultiplier={1.4} style={[styles.caption, styles.captionSpaced]}>
              BIC
            </Text>
            <TextInput
              accessibilityLabel="BIC"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              maxLength={14}
              onChangeText={(next) => {
                setBicDraft(next);
                setBank({ bic: normalizeBankValue(next) });
              }}
              placeholder="BNPAFRPP"
              placeholderTextColor={colors.ink3}
              ref={bicRef}
              returnKeyType="done"
              spellCheck={false}
              style={[styles.input, styles.bicInput, bicError && styles.inputError]}
              textContentType="none"
              value={bicShown}
            />
            {bicError ? (
              <Text maxFontSizeMultiplier={1.4} style={styles.error}>
                Le BIC compte 8 ou 11 caractères (ex. BNPAFRPP).
              </Text>
            ) : null}
          </View>
        ) : null}

        {canSaveAsDefault && onSaveAsDefaultChange ? (
          <View style={[styles.switchRow, styles.separated]}>
            <View style={styles.switchText}>
              <Text maxFontSizeMultiplier={1.4} style={styles.rowTitle}>
                Garder pour mes prochaines factures
              </Text>
              <Text maxFontSizeMultiplier={1.4} style={styles.rowSubtitle}>
                Enregistré dans l’entreprise à la création.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Garder ces coordonnées pour mes prochaines factures"
              ios_backgroundColor={colors.track}
              onValueChange={onSaveAsDefaultChange}
              thumbColor="#FFFFFF"
              trackColor={{ false: colors.track, true: colors.ok }}
              value={saveAsDefault}
            />
          </View>
        ) : null}
      </GroupCard>
      {bank.show && paid ? (
        <Text maxFontSizeMultiplier={1.4} style={styles.footnote}>
          Facture payée : les coordonnées bancaires ne sont pas imprimées.
        </Text>
      ) : null}

      <SectionHeader title="Mention de paiement" />
      <GroupCard>
        <View accessibilityRole="radiogroup">
          <MentionRow
            checked={mode === 'none'}
            hint="Rien n’est ajouté"
            label="Aucune"
            onPress={() => chooseMode('none')}
          />
          {PAYMENT_MENTION_PRESETS.map((preset) => (
            <MentionRow
              checked={mode === preset.id}
              hint={preset.text}
              key={preset.id}
              label={preset.label}
              onPress={() => chooseMode(preset.id)}
              separated
            />
          ))}
          <MentionRow
            checked={mode === 'custom'}
            hint="Écrivez votre propre mention"
            label="Texte libre"
            onPress={() => chooseMode('custom')}
            separated
          />
        </View>
      </GroupCard>

      {mode === 'none' ? (
        <Text maxFontSizeMultiplier={1.4} style={styles.footnote}>
          Entre professionnels, la facture doit indiquer les pénalités de retard et l’indemnité
          forfaitaire de 40 € pour frais de recouvrement.
        </Text>
      ) : (
        <TextInput
          accessibilityLabel="Texte de la mention de paiement"
          maxLength={2000}
          multiline
          onChangeText={editMention}
          placeholder="Délai de paiement, pénalités de retard, indemnité forfaitaire de 40 €…"
          placeholderTextColor={colors.ink3}
          style={styles.mentionInput}
          textAlignVertical="top"
          value={text}
        />
      )}

      {mismatch && mentionDays !== null && paymentDays !== null ? (
        <View style={styles.warning}>
          <View style={styles.warningDot} />
          <Text maxFontSizeMultiplier={1.4} style={styles.warningText}>
            {paymentDays === 0
              ? `La mention indique ${mentionDays} jours, mais la facture est payable à réception.`
              : `La mention indique ${mentionDays} jours, mais la facture est payable à ${paymentDays} jours.`}
          </Text>
          {paymentDays > 0 ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => editMention(withPaymentMentionDays(text, paymentDays))}
              style={({ pressed }) => [styles.warningAction, pressed && styles.pressed]}>
              <Text maxFontSizeMultiplier={1.3} style={styles.warningActionLabel}>
                Mettre {paymentDays} jours
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function MentionRow({
  label,
  hint,
  checked,
  onPress,
  separated = false,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onPress: () => void;
  separated?: boolean;
}) {
  const styles = useComposerStyles(paymentStyles);
  const colors = useComposerColors();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => [styles.mentionRow, separated && styles.separated, pressed && styles.pressed]}>
      <View style={styles.mentionText}>
        <Text
          maxFontSizeMultiplier={1.4}
          style={[styles.rowTitle, checked && styles.mentionTitleChecked]}>
          {label}
        </Text>
        <Text maxFontSizeMultiplier={1.3} numberOfLines={2} style={styles.rowSubtitle}>
          {hint}
        </Text>
      </View>
      <View style={styles.mentionCheck}>
        {checked ? (
          <ComposerIcon
            color={colors.accent}
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={16}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function paymentStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.6,
    },
    separated: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
    },
    switchRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    switchText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontSize: 16,
      color: colors.ink,
    },
    rowSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.ink3,
      marginTop: 2,
    },
    fieldBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 6,
    },
    caption: {
      fontSize: 14,
      color: colors.ink3,
    },
    captionSpaced: {
      marginTop: 6,
    },
    input: {
      ...tabularNums,
      height: 44,
      paddingHorizontal: 12,
      borderRadius: composerRadius.field,
      borderWidth: 1,
      borderColor: colors.line,
      fontSize: 16,
      letterSpacing: 0.3,
      color: colors.ink,
    },
    bicInput: {
      maxWidth: 200,
    },
    inputError: {
      borderColor: colors.danger,
    },
    error: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      color: colors.danger,
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.ink3,
      paddingHorizontal: 4,
      paddingTop: 8,
    },
    mentionRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    mentionText: {
      flex: 1,
      minWidth: 0,
    },
    mentionTitleChecked: {
      fontWeight: '600' as const,
      color: colors.accentInk,
    },
    mentionCheck: {
      width: 20,
      alignItems: 'center' as const,
    },
    mentionInput: {
      minHeight: 120,
      marginTop: 12,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 12,
      borderRadius: composerRadius.card,
      backgroundColor: colors.surface,
      fontSize: 16,
      lineHeight: 23,
      color: colors.ink,
    },
    warning: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      columnGap: 8,
      rowGap: 6,
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.soft,
    },
    warningDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.warn,
    },
    warningText: {
      flex: 1,
      minWidth: 180,
      fontSize: 13.5,
      lineHeight: 19,
      color: colors.ink2,
    },
    warningAction: {
      minHeight: 32,
      justifyContent: 'center' as const,
    },
    warningActionLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.accent,
    },
  };
}
