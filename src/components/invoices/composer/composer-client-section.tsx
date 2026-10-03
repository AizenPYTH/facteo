import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import {
  ComposerIcon,
  ComposerSheet,
  GroupCard,
  SearchTrack,
  SectionHeader,
  initialsOf,
} from '@/components/composer/primitives';
import {
  composerRadius,
  tabularNums,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { useClient, useInfiniteClients } from '@/hooks/use-clients';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { getClientDisplayName, type Client } from '@/types/client';

type ComposerClientSectionProps = {
  clientId: string | null;
  clientName: string;
  onSelectClient: (client: Client) => void;
  /** Validation échouée sans client : bordure rouge et message. */
  hasError: boolean;
};

function personName(client: Client): string {
  return [client.firstName, client.lastName].filter(Boolean).join(' ').trim();
}

function contactLine(client: Client): string | null {
  const person = personName(client);
  if (client.company?.trim() && person) return person;
  return client.email?.trim() || client.phone?.trim() || null;
}

function addressLines(client: Client): string | null {
  const city = [client.postalCode, client.city].filter(Boolean).join(' ').trim();
  const lines = [client.address?.trim(), city].filter(Boolean);
  return lines.length > 0 ? lines.join(', ') : null;
}

function idLine(client: Client): string | null {
  const siren = client.siren?.trim() || client.siret?.trim().slice(0, 9);
  const parts = [client.city?.trim(), siren ? `SIREN ${siren}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Section « Client » : carte du client choisi (avatar, contact, adresse, TVA)
 * ou champ de recherche ; le choix se fait dans une feuille.
 */
export function ComposerClientSection({
  clientId,
  clientName,
  onSelectClient,
  hasError,
}: ComposerClientSectionProps) {
  const styles = useComposerStyles(clientStyles);
  const colors = useComposerColors();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: client } = useClient(clientId ?? '');
  const displayName = client ? getClientDisplayName(client) : clientName;

  function openNewClient() {
    setPickerOpen(false);
    router.push('/clients/new' as Href);
  }

  return (
    <>
      <SectionHeader actionLabel="+ Nouveau" onAction={openNewClient} title="Client" />

      {clientId ? (
        <GroupCard>
          <Pressable
            accessibilityHint="Changer de client"
            accessibilityLabel={`Client : ${displayName}`}
            accessibilityRole="button"
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.clientHead, pressed && styles.pressed]}>
            <View style={styles.avatar}>
              <Text maxFontSizeMultiplier={1.2} style={styles.avatarLabel}>
                {initialsOf(displayName)}
              </Text>
            </View>
            <View style={styles.clientText}>
              <Text maxFontSizeMultiplier={1.4} style={styles.clientName}>
                {displayName || 'Client'}
              </Text>
              {client && contactLine(client) ? (
                <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.clientContact}>
                  {contactLine(client)}
                </Text>
              ) : null}
            </View>
            <ComposerIcon
              color={colors.ink3}
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={13}
            />
          </Pressable>
          {client && addressLines(client) ? (
            <View style={styles.detailRow}>
              <Text maxFontSizeMultiplier={1.4} style={styles.detailKey}>
                Adresse
              </Text>
              <Text maxFontSizeMultiplier={1.4} style={styles.detailValue}>
                {addressLines(client)}
              </Text>
            </View>
          ) : null}
          {client?.vatNumber?.trim() ? (
            <View style={styles.detailRow}>
              <Text maxFontSizeMultiplier={1.4} style={styles.detailKey}>
                TVA
              </Text>
              <Text maxFontSizeMultiplier={1.4} style={[styles.detailValue, tabularNums]}>
                {client.vatNumber}
              </Text>
            </View>
          ) : null}
        </GroupCard>
      ) : (
        <>
          <Pressable
            accessibilityHint="Ouvre la liste des clients"
            accessibilityLabel="Rechercher un client"
            accessibilityRole="button"
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [
              styles.searchButton,
              hasError && styles.searchButtonError,
              pressed && styles.pressed,
            ]}>
            <ComposerIcon
              color={colors.ink3}
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={18}
            />
            <Text maxFontSizeMultiplier={1.3} style={styles.searchPlaceholder}>
              Rechercher un client, un SIREN
            </Text>
          </Pressable>
          {hasError ? (
            <Text maxFontSizeMultiplier={1.3} style={styles.errorText}>
              Choisissez un client pour créer la facture.
            </Text>
          ) : null}
        </>
      )}

      <ClientPickerSheet
        onClose={() => setPickerOpen(false)}
        onCreate={openNewClient}
        onSelect={(picked) => {
          void triggerSelectionHaptic();
          onSelectClient(picked);
          setPickerOpen(false);
        }}
        selectedClientId={clientId}
        visible={pickerOpen}
      />
    </>
  );
}

function ClientPickerSheet({
  visible,
  selectedClientId,
  onClose,
  onSelect,
  onCreate,
}: {
  visible: boolean;
  selectedClientId: string | null;
  onClose: () => void;
  onSelect: (client: Client) => void;
  onCreate: () => void;
}) {
  const styles = useComposerStyles(clientStyles);
  const colors = useComposerColors();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { clients, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteClients(debouncedSearch);
  const isSearching = debouncedSearch.trim().length > 0;

  // Même ordre que l'ancienne étape client : sélection, 5 récents, puis A → Z.
  const sorted = useMemo(() => {
    const byName = (left: Client, right: Client) =>
      getClientDisplayName(left).localeCompare(getClientDisplayName(right), 'fr');
    let list: Client[];
    if (isSearching) {
      list = [...clients].sort(byName);
    } else {
      const recent = [...clients]
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
        .slice(0, 5);
      const recentIds = new Set(recent.map((client) => client.id));
      list = [...recent, ...clients.filter((client) => !recentIds.has(client.id)).sort(byName)];
    }
    return [...list].sort((left, right) =>
      left.id === selectedClientId ? -1 : right.id === selectedClientId ? 1 : 0,
    );
  }, [clients, isSearching, selectedClientId]);

  function close() {
    setSearch('');
    onClose();
  }

  const createLabel = search.trim() ? `Créer « ${search.trim()} »` : 'Créer un nouveau client';

  return (
    <ComposerSheet onClose={close} title="Choisir un client" visible={visible}>
      <View style={styles.pickerToolbar}>
        <SearchTrack>
          <TextInput
            accessibilityLabel="Rechercher un client"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Nom, ville ou SIREN"
            placeholderTextColor={colors.ink3}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />
        </SearchTrack>
      </View>
      <FlatList
        contentContainerStyle={styles.pickerList}
        data={sorted}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.accent} style={styles.pickerLoading} />
          ) : (
            <Text maxFontSizeMultiplier={1.3} style={styles.pickerEmpty}>
              Aucun client trouvé.
            </Text>
          )
        }
        ListFooterComponent={
          <>
            <Pressable
              accessibilityRole="button"
              onPress={onCreate}
              style={({ pressed }) => [
                styles.createRow,
                sorted.length === 0 && styles.createRowAlone,
                pressed && styles.pressed,
              ]}>
              <ComposerIcon
                color={colors.accent}
                name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
                size={20}
              />
              <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.createLabel}>
                {createLabel}
              </Text>
            </Pressable>
            <Text maxFontSizeMultiplier={1.3} style={styles.pickerHint}>
              Un SIREN ou SIRET remplit la fiche automatiquement.
            </Text>
            {isFetchingNextPage ? <ActivityIndicator color={colors.accent} /> : null}
          </>
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        renderItem={({ item, index }) => {
          const name = getClientDisplayName(item);
          const meta = idLine(item);
          const selected = item.id === selectedClientId;
          return (
            <Pressable
              accessibilityLabel={meta ? `${name}, ${meta}` : name}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(item)}
              style={({ pressed }) => [
                styles.resultRow,
                index === 0 && styles.resultFirst,
                index > 0 && styles.resultSeparated,
                pressed && styles.resultPressed,
              ]}>
              <View style={[styles.resultAvatar, selected && styles.resultAvatarSelected]}>
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={[styles.resultAvatarLabel, selected && styles.resultAvatarLabelSelected]}>
                  {initialsOf(name)}
                </Text>
              </View>
              <View style={styles.clientText}>
                <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.resultName}>
                  {name}
                </Text>
                {meta ? (
                  <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.resultMeta}>
                    {meta}
                  </Text>
                ) : null}
              </View>
              {selected ? (
                <ComposerIcon
                  color={colors.accent}
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={16}
                />
              ) : null}
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </ComposerSheet>
  );
}

function clientStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.6,
    },
    clientHead: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 64,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    avatarLabel: {
      fontSize: 15,
      fontWeight: '800' as const,
      color: colors.accentInk,
    },
    clientText: {
      flex: 1,
      minWidth: 0,
    },
    clientName: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    clientContact: {
      fontSize: 14,
      color: colors.ink3,
      marginTop: 1,
    },
    detailRow: {
      flexDirection: 'row' as const,
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.line2,
    },
    detailKey: {
      width: 62,
      fontSize: 14,
      color: colors.ink3,
    },
    detailValue: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink2,
    },
    searchButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      height: 52,
      paddingHorizontal: 16,
      borderRadius: composerRadius.card,
      borderWidth: 1.5,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    searchButtonError: {
      borderColor: colors.danger,
    },
    searchPlaceholder: {
      fontSize: 16,
      color: colors.ink3,
    },
    errorText: {
      fontSize: 13.5,
      fontWeight: '600' as const,
      color: colors.danger,
      paddingTop: 8,
      paddingHorizontal: 4,
    },
    pickerToolbar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.ink,
      paddingVertical: 0,
    },
    pickerList: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    pickerLoading: {
      paddingVertical: 24,
    },
    pickerEmpty: {
      fontSize: 15,
      color: colors.ink3,
      textAlign: 'center' as const,
      paddingVertical: 20,
    },
    resultRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      minHeight: 60,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    resultFirst: {
      borderTopLeftRadius: composerRadius.card,
      borderTopRightRadius: composerRadius.card,
    },
    resultSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
    },
    resultPressed: {
      backgroundColor: colors.soft,
    },
    resultAvatar: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.soft,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    resultAvatarSelected: {
      backgroundColor: colors.accentSoft,
    },
    resultAvatarLabel: {
      fontSize: 13,
      fontWeight: '800' as const,
      color: colors.ink2,
    },
    resultAvatarLabelSelected: {
      color: colors.accentInk,
    },
    resultName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    resultMeta: {
      ...tabularNums,
      fontSize: 13.5,
      color: colors.ink3,
      marginTop: 1,
    },
    createRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      minHeight: 52,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.line2,
      borderBottomLeftRadius: composerRadius.card,
      borderBottomRightRadius: composerRadius.card,
    },
    createRowAlone: {
      borderTopWidth: 0,
      borderRadius: composerRadius.card,
    },
    createLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    pickerHint: {
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.ink3,
      paddingHorizontal: 4,
      paddingVertical: 10,
    },
  };
}
