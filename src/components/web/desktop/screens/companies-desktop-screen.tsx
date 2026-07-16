import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CompanyWorkspaceSheet } from '@/components/company/company-workspace-sheet';
import { DesktopPanel } from '@/components/web/desktop/desktop-panel';
import { DesktopTopHeader } from '@/components/web/desktop/desktop-top-header';
import { ThreeColumnWorkspace } from '@/components/web/desktop/layout/three-column-workspace';
import { DesktopActionButton } from '@/components/web/desktop/ui/desktop-badge';
import { DesktopBadge } from '@/components/web/desktop/ui/desktop-badge';
import { DesktopSearchInput } from '@/components/web/desktop/ui/desktop-search-input';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/app-text';
import { useAuth } from '@/hooks/use-auth';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useCompanyManagement } from '@/hooks/use-company-management';
import { useTenant } from '@/hooks/use-tenant';
import { useToast } from '@/providers/toast-provider';
import { formatDate } from '@/lib/format/date';
import type { TenantCompany } from '@/types/tenant';

type CompanyFilter = 'all' | 'active' | 'archived';

export function CompaniesDesktopScreen() {
  const styles = useStyles();
  const { user } = useAuth();
  const { showSuccess } = useToast();
  const { companies, activeCompany, switchCompany } = useTenant();
  const { deleteCompany } = useCompanyManagement();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(activeCompany?.id ?? null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CompanyFilter>('all');
  const [deleting, setDeleting] = useState(false);

  const selectedCompany =
    companies.find((company) => company.id === selectedId) ?? activeCompany ?? null;
  const isActive = selectedCompany?.id === activeCompany?.id;

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return companies.filter((company) => {
      if (filter === 'active' && company.id !== activeCompany?.id) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        company.name.toLowerCase().includes(query) ||
        company.siret?.toLowerCase().includes(query) ||
        company.city?.toLowerCase().includes(query)
      );
    });
  }, [activeCompany?.id, companies, filter, search]);

  async function handleDelete() {
    if (!selectedCompany || isActive) {
      return;
    }

    setDeleting(true);
    try {
      await deleteCompany.mutateAsync(selectedCompany.id);
      setSelectedId(activeCompany?.id ?? null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={styles.root}>
      <DesktopTopHeader
        actions={
          <Button onPress={() => setSheetVisible(true)} title="Créer une entreprise" />
        }
        subtitle="Gérez vos espaces de travail et basculez entre entreprises"
        title="Entreprises"
      />

      <ThreeColumnWorkspace
        center={
          <DesktopPanel
            flush
            subtitle="Coordonnées et informations légales"
            title={selectedCompany?.name ?? 'Informations'}>
            {!selectedCompany ? (
              <AppText color="secondary" style={styles.empty} variant="body">
                Sélectionnez une entreprise pour afficher ses informations.
              </AppText>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.centerScroll}>
                <InfoSection title="Informations générales">
                  <InfoRow label="Raison sociale" value={selectedCompany.name} />
                  <InfoRow label="Statut" value={isActive ? 'Espace actif' : 'Disponible'} />
                  <InfoRow label="Rôle" value={formatRole(selectedCompany.role)} />
                  <InfoRow
                    label="Créée le"
                    value={formatDate(selectedCompany.createdAt)}
                  />
                </InfoSection>

                <InfoSection title="Coordonnées">
                  <InfoRow label="E-mail" value={selectedCompany.email} />
                  <InfoRow label="Téléphone" value={selectedCompany.phone} />
                  <InfoRow label="Adresse" value={formatAddress(selectedCompany)} />
                </InfoSection>

                <InfoSection title="Facturation">
                  <InfoRow label="SIRET" value={selectedCompany.siret} />
                  <InfoRow label="N° TVA" value={selectedCompany.vatNumber} />
                  <InfoRow label="IBAN" value={selectedCompany.iban} />
                  <InfoRow label="BIC" value={selectedCompany.bic} />
                </InfoSection>

                <InfoSection title="Utilisateurs">
                  <InfoRow label="Utilisateur principal" value={user?.email ?? '—'} />
                  <InfoRow label="Collaborateurs" value="Bientôt disponible" />
                </InfoSection>

                <InfoSection title="Historique">
                  <InfoRow
                    label="Dernière modification"
                    value={formatDate(selectedCompany.updatedAt)}
                  />
                </InfoSection>
              </ScrollView>
            )}
          </DesktopPanel>
        }
        left={
          <DesktopPanel flush title="Entreprises">
            <View style={styles.listToolbar}>
              <DesktopSearchInput
                onChangeText={setSearch}
                placeholder="Rechercher…"
                value={search}
              />
              <View style={styles.filters}>
                <FilterChip
                  active={filter === 'all'}
                  label="Toutes"
                  onPress={() => setFilter('all')}
                />
                <FilterChip
                  active={filter === 'active'}
                  label="Active"
                  onPress={() => setFilter('active')}
                />
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
              {filteredCompanies.length === 0 ? (
                <Text style={styles.listEmpty}>Aucune entreprise trouvée.</Text>
              ) : (
                filteredCompanies.map((company) => (
                  <CompanyListCard
                    active={company.id === activeCompany?.id}
                    company={company}
                    key={company.id}
                    onActivate={() => switchCompany(company.id)}
                    onPress={() => setSelectedId(company.id)}
                    ownerEmail={user?.email}
                    selected={company.id === selectedId}
                  />
                ))
              )}
            </ScrollView>
          </DesktopPanel>
        }
        right={
          <DesktopPanel flush title="Actions rapides">
            <View style={styles.actions}>
              <DesktopActionButton
                disabled={!selectedCompany}
                icon={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
                label="Modifier"
                onPress={() => router.push('/company' as Href)}
              />
              <DesktopActionButton
                disabled={!selectedCompany}
                icon={{ ios: 'photo', android: 'image', web: 'image' }}
                label="Changer le logo"
                onPress={() => router.push('/company' as Href)}
              />
              <DesktopActionButton
                disabled
                icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
                label="Inviter un collaborateur"
                onPress={() => showSuccess('Bientôt disponible.')}
              />
              {!isActive && selectedCompany ? (
                <DesktopActionButton
                  icon={{ ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' }}
                  label="Activer cet espace"
                  onPress={() => switchCompany(selectedCompany.id)}
                />
              ) : null}
              <DesktopActionButton
                disabled={!selectedCompany || isActive}
                icon={{ ios: 'archivebox', android: 'archive', web: 'archive' }}
                label="Archiver"
                onPress={() => showSuccess('Archivage bientôt disponible.')}
              />
              <DesktopActionButton
                destructive
                disabled={!selectedCompany || isActive}
                icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
                label="Supprimer"
                loading={deleting}
                onPress={() => void handleDelete()}
              />
            </View>
          </DesktopPanel>
        }
      />

      <CompanyWorkspaceSheet
        activeCompany={activeCompany}
        companies={companies}
        onClose={() => setSheetVisible(false)}
        onSelect={switchCompany}
        visible={sheetVisible}
      />
    </View>
  );
}

function CompanyListCard({
  company,
  selected,
  active,
  ownerEmail,
  onPress,
  onActivate,
}: {
  company: TenantCompany;
  selected: boolean;
  active: boolean;
  ownerEmail?: string | null;
  onPress: () => void;
  onActivate: () => void;
}) {
  const styles = useCardStyles();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.row}>
        {company.logoUrl ? (
          <Image source={{ uri: company.logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoInitial}>{company.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.name}>
            {company.name}
          </Text>
          <Text numberOfLines={1} style={styles.owner}>
            {ownerEmail ?? '—'}
          </Text>
        </View>
        {active ? (
          <DesktopBadge label="Actif" tone="success" />
        ) : (
          <Pressable onPress={onActivate} style={styles.activateBtn}>
            <Text style={styles.activateText}>Activer</Text>
          </Pressable>
        )}
      </View>
      {company.city ? (
        <Text numberOfLines={1} style={styles.meta}>
          {company.city}
          {company.siret ? ` · ${company.siret}` : ''}
        </Text>
      ) : null}
    </Pressable>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  const styles = useSectionStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  const styles = useRowStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value?.trim() ? value : '—'}</Text>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useChipStyles();
  return (
    <Pressable onPress={onPress} style={active ? styles.active : styles.chip}>
      <Text style={active ? styles.activeText : styles.text}>{label}</Text>
    </Pressable>
  );
}

function formatAddress(company: TenantCompany): string | null {
  const parts = [
    company.address,
    [company.postalCode, company.city].filter(Boolean).join(' '),
    company.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function formatRole(role: TenantCompany['role']): string {
  if (role === 'owner') return 'Propriétaire';
  if (role === 'admin') return 'Administrateur';
  return 'Membre';
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: { flex: 1, minHeight: 0 },
    listToolbar: {
      padding: spacing.md,
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    filters: { flexDirection: 'row', gap: spacing.xs },
    list: { flex: 1, padding: spacing.sm },
    listEmpty: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: spacing.xl,
    },
    centerScroll: { flex: 1 },
    actions: { padding: spacing.md, gap: spacing.sm },
    empty: { padding: spacing.xl, textAlign: 'center' },
  }));

const useCardStyles = () =>
  useThemedStyles((colors) => ({
    card: {
      padding: spacing.md,
      borderRadius: radius.md,
      gap: spacing.xs,
      marginBottom: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    cardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    logo: { width: 40, height: 40, borderRadius: radius.sm },
    logoPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoInitial: { ...typography.subheadlineMedium, color: colors.primary },
    info: { flex: 1, minWidth: 0, gap: 2 },
    name: { ...typography.subheadlineMedium, color: colors.text },
    owner: { ...typography.caption2, color: colors.textSecondary },
    meta: { ...typography.caption2, color: colors.textTertiary, paddingLeft: 48 },
    activateBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    activateText: { ...typography.caption2, color: colors.primary, fontWeight: '600' },
  }));

const useSectionStyles = () =>
  useThemedStyles((colors) => ({
    section: { padding: spacing.lg, gap: spacing.sm },
    title: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
  }));

const useRowStyles = () =>
  useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    label: { ...typography.caption1, color: colors.textSecondary, flex: 1 },
    value: {
      ...typography.subheadline,
      color: colors.text,
      flex: 1.2,
      textAlign: 'right',
    },
  }));

const useChipStyles = () =>
  useThemedStyles((colors) => ({
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSecondary,
    },
    active: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: colors.primarySubtle,
    },
    text: { ...typography.caption2, color: colors.textSecondary },
    activeText: { ...typography.caption2, color: colors.primary, fontWeight: '600' },
  }));
