import { useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormNavigationProvider } from '@/components/ui/form/form-navigation';
import { KeyboardFormSheet } from '@/components/ui/keyboard/keyboard-form-sheet';
import { ModalHeader } from '@/components/ui/navigation-header';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { parseDecimalInput } from '@/lib/format/decimal';
import type { ProductRow } from '@/types/database';

export type CatalogItemValues = {
  name: string;
  description: string;
  unitPrice: number;
  vatRate: number;
  unit: string;
  reference: string;
};

export type CatalogItemSheetProps = {
  visible: boolean;
  /** Élément à modifier ; absent pour une création. */
  item?: ProductRow | null;
  type: 'product' | 'service';
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: CatalogItemValues) => void;
  /** Suppression, proposée uniquement en édition. */
  onDelete?: () => void;
};

type Draft = {
  name: string;
  description: string;
  unitPrice: string;
  vatRate: string;
  unit: string;
  reference: string;
};

function toDraft(item?: ProductRow | null): Draft {
  return {
    name: item?.name ?? '',
    description: item?.description ?? '',
    unitPrice: item ? String(item.unit_price) : '',
    vatRate: item ? String(item.vat_rate) : '20',
    unit: item?.unit ?? 'pièce',
    reference: item?.reference ?? '',
  };
}

/**
 * Création et édition d'un élément de catalogue.
 *
 * Le formulaire est monté avec l'élément pour clé : ouvrir la feuille sur un
 * autre élément le remonte, et l'état part des bonnes valeurs sans effet de
 * synchronisation.
 */
export function CatalogItemSheet({
  visible,
  item,
  type,
  loading = false,
  onClose,
  onSubmit,
  onDelete,
}: CatalogItemSheetProps) {
  const styles = useStyles();
  const isService = type === 'service';
  const sheetTitle = item
    ? isService
      ? 'Modifier la prestation'
      : 'Modifier le produit'
    : isService
      ? 'Nouvelle prestation'
      : 'Nouveau produit';

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}>
      <View style={styles.root}>
        <ModalHeader onClose={onClose} title={sheetTitle} />

        {visible ? (
          <CatalogItemForm
            item={item}
            key={item?.id ?? 'new'}
            loading={loading}
            onDelete={onDelete}
            onSubmit={onSubmit}
            type={type}
          />
        ) : null}
      </View>
    </Modal>
  );
}

/**
 * Corps du formulaire. Les champs sont sous `FormNavigationProvider` :
 * « Suivant » enchaîne, et la validation depuis le dernier champ enregistre.
 */
function CatalogItemForm({
  item,
  type,
  loading,
  onSubmit,
  onDelete,
}: {
  item?: ProductRow | null;
  type: 'product' | 'service';
  loading: boolean;
  onSubmit: (values: CatalogItemValues) => void;
  onDelete?: () => void;
}) {
  const styles = useStyles();
  const [draft, setDraft] = useState<Draft>(() => toDraft(item));
  const [showErrors, setShowErrors] = useState(false);

  const isService = type === 'service';
  const nameError = draft.name.trim().length === 0 ? 'Une désignation est requise.' : undefined;
  const price = parseDecimalInput(draft.unitPrice || '0');
  const priceError = Number.isFinite(price) && price >= 0 ? undefined : 'Prix invalide.';
  const vat = parseDecimalInput(draft.vatRate || '0');
  const vatError = Number.isFinite(vat) && vat >= 0 && vat <= 100 ? undefined : 'TVA invalide.';
  const invalid = Boolean(nameError || priceError || vatError);

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit() {
    if (invalid) {
      setShowErrors(true);
      return;
    }

    onSubmit({
      name: draft.name.trim(),
      description: draft.description.trim(),
      unitPrice: price,
      vatRate: vat,
      unit: draft.unit.trim() || 'pièce',
      reference: draft.reference.trim(),
    });
  }

  return (
    <FormNavigationProvider onSubmit={handleSubmit} submitReturnKey="done">
      <KeyboardFormSheet
        footer={
          <Button loading={loading} onPress={handleSubmit} title={item ? 'Enregistrer' : 'Créer'} />
        }>
        <TextField
          autoCapitalize="sentences"
          error={showErrors ? nameError : undefined}
          label="Désignation"
          onChangeText={(text) => update('name', text)}
          placeholder={isService ? 'Prestation de conseil' : 'Article'}
          value={draft.name}
        />

        <TextField
          autoCapitalize="sentences"
          label="Description"
          multiline
          numberOfLines={2}
          onChangeText={(text) => update('description', text)}
          placeholder="Détail affiché sur le document"
          textAlignVertical="top"
          value={draft.description}
        />

        <View style={styles.row}>
          <View style={styles.field}>
            <TextField
              error={showErrors ? priceError : undefined}
              keyboardType="decimal-pad"
              label="Prix HT"
              onChangeText={(text) => update('unitPrice', text)}
              placeholder="0"
              value={draft.unitPrice}
            />
          </View>
          <View style={styles.field}>
            <TextField
              error={showErrors ? vatError : undefined}
              keyboardType="decimal-pad"
              label="TVA (%)"
              onChangeText={(text) => update('vatRate', text)}
              placeholder="20"
              value={draft.vatRate}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <TextField
              label="Unité"
              onChangeText={(text) => update('unit', text)}
              placeholder="pièce"
              value={draft.unit}
            />
          </View>
          <View style={styles.field}>
            <TextField
              autoCapitalize="characters"
              label="Référence"
              onChangeText={(text) => update('reference', text)}
              placeholder="REF-001"
              value={draft.reference}
            />
          </View>
        </View>

        <Text maxFontSizeMultiplier={1.4} style={styles.hint}>
          Ces valeurs préremplissent la ligne quand vous ajoutez cet élément à un devis ou une
          facture. Elles restent modifiables document par document.
        </Text>

        {item && onDelete ? (
          // La suppression vit dans la feuille d'édition : en liste, elle
          // n'aurait été atteignable que par un appui long, invisible.
          <View style={styles.deleteBlock}>
            <Button
              accessibilityLabel={isService ? 'Supprimer la prestation' : 'Supprimer le produit'}
              onPress={onDelete}
              title="Supprimer"
              variant="ghost"
            />
          </View>
        ) : null}
      </KeyboardFormSheet>
    </FormNavigationProvider>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    field: {
      flex: 1,
      minWidth: 0,
    },
    hint: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    deleteBlock: {
      paddingTop: spacing.sm,
    },
  }));
}
