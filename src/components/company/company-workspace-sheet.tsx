import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { useCompanyAsset } from '@/hooks/use-company-asset';
import { useCompanyManagement } from '@/hooks/use-company-management';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { useToast } from '@/providers/toast-provider';
import type { TenantCompany } from '@/types/tenant';

type CompanyWorkspaceSheetProps = {
  visible: boolean;
  companies: TenantCompany[];
  activeCompany: TenantCompany | null;
  onClose: () => void;
  onSelect: (companyId: string) => void;
};

function formatSiren(siret: string | null): string | null {
  if (!siret) {
    return null;
  }

  const digits = siret.replace(/\s/g, '');
  return digits.length >= 9 ? digits.slice(0, 9) : digits;
}

export function CompanyWorkspaceSheet({
  visible,
  companies,
  activeCompany,
  onClose,
  onSelect,
}: CompanyWorkspaceSheetProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const { createCompany, renameCompany, deleteCompany } = useCompanyManagement();
  const { uploadAsset } = useCompanyAsset('logo');

  const [createName, setCreateName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  async function handleCreate() {
    if (!createName.trim()) {
      showError('Indiquez le nom de l’entreprise.');
      return;
    }

    try {
      await createCompany.mutateAsync({ name: createName.trim() });
      setCreateName('');
      showSuccess('Entreprise créée.');
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleRename(company: TenantCompany) {
    if (!editingName.trim()) {
      showError('Le nom ne peut pas être vide.');
      return;
    }

    try {
      await renameCompany.mutateAsync({ companyId: company.id, name: editingName.trim() });
      setEditingId(null);
      showSuccess('Nom mis à jour.');
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  function handleDelete(company: TenantCompany) {
    Alert.alert(
      'Supprimer l’entreprise',
      `Supprimer « ${company.name} » ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteCompany.mutateAsync(company.id);
                showSuccess('Entreprise supprimée.');
              } catch (error) {
                showError(readErrorMessage(error));
              }
            })();
          },
        },
      ],
    );
  }

  async function handleChangeLogo(company: TenantCompany) {
    if (company.id !== activeCompany?.id) {
      onSelect(company.id);
    }

    try {
      const result = await uploadAsset.mutateAsync(company.logoUrl);
      if (result.status === 'success') {
        showSuccess('Logo mis à jour.');
      }
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <AppText variant="title">Espaces de travail</AppText>
          <AppText color="secondary" variant="subtitle">
            Gérez vos entreprises et changez d’espace en un clic.
          </AppText>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {companies.map((company) => {
              const isActive = company.id === activeCompany?.id;
              const isEditing = editingId === company.id;
              const siren = formatSiren(company.siret);

              return (
                <View key={company.id} style={[styles.card, isActive && styles.cardActive]}>
                  <Pressable
                    onPress={() => {
                      onSelect(company.id);
                      onClose();
                    }}
                    style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
                    <View style={styles.avatar}>
                      {company.logoUrl ? (
                        <Image contentFit="cover" source={{ uri: company.logoUrl }} style={styles.avatarImage} />
                      ) : (
                        <AppText variant="title">{company.name.slice(0, 1).toUpperCase()}</AppText>
                      )}
                    </View>

                    <View style={styles.cardText}>
                      {isEditing ? (
                        <TextInput
                          autoFocus
                          onChangeText={setEditingName}
                          placeholder="Nom de l’entreprise"
                          placeholderTextColor={colors.textTertiary}
                          style={styles.input}
                          value={editingName}
                        />
                      ) : (
                        <>
                          <AppText medium numberOfLines={1} variant="body">
                            {company.name}
                          </AppText>
                          {siren ? (
                            <AppText color="secondary" variant="caption">
                              SIREN {siren}
                            </AppText>
                          ) : null}
                        </>
                      )}
                    </View>

                    {isActive ? (
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        size={22}
                        tintColor={colors.primary}
                      />
                    ) : null}
                  </Pressable>

                  <View style={styles.cardActions}>
                    {isEditing ? (
                      <>
                        <Button
                          loading={renameCompany.isPending}
                          onPress={() => void handleRename(company)}
                          title="Enregistrer"
                        />
                        <Button onPress={() => setEditingId(null)} title="Annuler" variant="ghost" />
                      </>
                    ) : (
                      <>
                        <Button
                          onPress={() => {
                            setEditingId(company.id);
                            setEditingName(company.name);
                          }}
                          title="Renommer"
                          variant="ghost"
                        />
                        <Button
                          loading={uploadAsset.isPending}
                          onPress={() => void handleChangeLogo(company)}
                          title="Logo"
                          variant="ghost"
                        />
                        <Button
                          loading={deleteCompany.isPending}
                          onPress={() => handleDelete(company)}
                          title="Supprimer"
                          variant="ghost"
                        />
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.createBlock}>
            <AppText medium variant="body">Nouvelle entreprise</AppText>
            <TextInput
              onChangeText={setCreateName}
              placeholder="Nom de l’entreprise"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              value={createName}
            />
            <Button loading={createCompany.isPending} onPress={() => void handleCreate()} title="Créer" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur est survenue.';
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderStrong,
    },
    list: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.backgroundGrouped,
      overflow: 'hidden',
    },
    cardActive: {
      borderColor: colors.primary,
    },
    cardMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    avatar: {
      width: components.workspaceAvatarSize,
      height: components.workspaceAvatarSize,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    cardText: {
      flex: 1,
      gap: 2,
    },
    cardActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    createBlock: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.9,
    },
  }));
