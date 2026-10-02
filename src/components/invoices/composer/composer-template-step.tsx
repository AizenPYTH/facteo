import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import {
  ComposerIcon,
  GroupCard,
  Pill,
  SectionHeader,
  SegmentedControl,
} from '@/components/composer/primitives';
import {
  formatShortFrenchDate,
  groupVatByRate,
} from '@/components/invoices/composer/composer-model';
import { useFieldNavigation } from '@/components/ui/form/form-navigation';
import {
  composerRadius,
  tabularNums,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import type { DocumentTotals } from '@/lib/calculations/totals';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { PDF_TEMPLATES, resolvePdfTemplate } from '@/lib/pdf/engine/templates/registry';
import {
  TEMPLATE_CATEGORY_LABELS,
  type PdfTemplateDefinition,
  type TemplateCategory,
} from '@/lib/pdf/engine/templates/types';
import type { InvoiceLineValue } from '@/types/invoice';
import {
  DEFAULT_INVOICE_TITLE,
  formatIssuerLegalIds,
  INVOICE_TITLE_SUGGESTIONS,
  ISSUER_LEGAL_ID_LABELS,
  ISSUER_LEGAL_IDS,
  STAMP_COLOR_LABELS,
  STAMP_COLOR_VALUES,
  STAMP_COLORS,
  STAMP_POSITION_LABELS,
  STAMP_POSITIONS,
  type InvoicePdfOptions,
  type IssuerLegalId,
  type StampPosition,
} from '@/types/pdf-options';

type CategoryFilter = 'all' | TemplateCategory;

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  ...(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[])
    .filter((category) =>
      PDF_TEMPLATES.some((template) => (template.category ?? 'classique') === category),
    )
    .map((category) => ({ value: category, label: TEMPLATE_CATEGORY_LABELS[category] })),
];

type ComposerTemplateStepProps = {
  mode: 'create' | 'edit';
  templateId: string | null;
  pdfOptions: InvoicePdfOptions;
  onPdfOptionsChange: (value: InvoicePdfOptions) => void;
  customNumber: string;
  onCustomNumberChange: (value: string) => void;
  forecastNumber: string | null;
  company: { siret?: string | null; vatNumber?: string | null } | null;
  notes: string;
  onNotesChange: (value: string) => void;
  clientName: string;
  dueAt: string;
  paymentTermsDays: string;
  lines: InvoiceLineValue[];
  totals: DocumentTotals;
  onOpenGallery: () => void;
  onOpenPreview: () => void;
};

/**
 * Étape 3 : modèle (pastilles + carrousel), notes, options de présentation
 * repliables, récapitulatif et accès à l'aperçu PDF.
 */
export function ComposerTemplateStep({
  mode,
  templateId,
  pdfOptions,
  onPdfOptionsChange,
  customNumber,
  onCustomNumberChange,
  forecastNumber,
  company,
  notes,
  onNotesChange,
  clientName,
  dueAt,
  paymentTermsDays,
  lines,
  totals,
  onOpenGallery,
  onOpenPreview,
}: ComposerTemplateStepProps) {
  const styles = useComposerStyles(templateStyles);
  const colors = useComposerColors();
  const activeTemplate = resolvePdfTemplate(templateId);
  const [category, setCategory] = useState<CategoryFilter>(
    () => activeTemplate.category ?? 'classique',
  );
  const notesField = useFieldNavigation({ multiline: true });
  const isCreate = mode === 'create';

  const strip = useMemo(() => {
    const list =
      category === 'all'
        ? PDF_TEMPLATES
        : PDF_TEMPLATES.filter((template) => (template.category ?? 'classique') === category);
    // Le modèle choisi passe en tête quand il fait partie du filtre.
    return [...list].sort((left, right) =>
      left.id === activeTemplate.id ? -1 : right.id === activeTemplate.id ? 1 : 0,
    );
  }, [activeTemplate.id, category]);

  const vatGroups = useMemo(() => groupVatByRate(lines), [lines]);
  const dueDate = formatShortFrenchDate(dueAt);
  const dueLabel =
    paymentTermsDays.trim() === ''
      ? dueDate
        ? `À réception · ${dueDate}`
        : 'À réception'
      : (dueDate ?? (dueAt || '—'));

  return (
    <>
      {isCreate ? (
        <>
          <SectionHeader
            actionLabel={`Les ${PDF_TEMPLATES.length} ›`}
            first
            onAction={onOpenGallery}
            title="Modèle du PDF"
          />
          <ScrollView
            contentContainerStyle={styles.pills}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}>
            {CATEGORY_FILTERS.map((filter) => (
              <Pill
                key={filter.value}
                label={filter.label}
                onPress={() => setCategory(filter.value)}
                selected={category === filter.value}
                variant="solid"
              />
            ))}
          </ScrollView>
          <ScrollView
            contentContainerStyle={styles.strip}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}>
            {strip.map((template) => (
              <TemplateThumb
                key={template.id}
                onPress={() => {
                  void triggerSelectionHaptic();
                  onPdfOptionsChange({ ...pdfOptions, templateId: template.id });
                }}
                selected={template.id === activeTemplate.id}
                template={template}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      <SectionHeader first={!isCreate} title="Notes sur la facture" />
      <TextInput
        accessibilityLabel="Notes sur la facture"
        multiline
        onChangeText={onNotesChange}
        placeholder="Conditions, remerciements…"
        placeholderTextColor={colors.ink3}
        ref={notesField?.ref}
        style={styles.notes}
        textAlignVertical="top"
        value={notes}
      />

      {isCreate ? (
        <>
          <SectionHeader title="Présentation" />
          <PresentationOptions
            company={company}
            customNumber={customNumber}
            forecastNumber={forecastNumber}
            onChange={onPdfOptionsChange}
            onCustomNumberChange={onCustomNumberChange}
            value={pdfOptions}
          />
        </>
      ) : null}

      <SectionHeader title="Récapitulatif" />
      <GroupCard style={styles.recap}>
        <RecapRow label="Client" strong value={clientName || '—'} />
        <RecapRow label="Échéance" separated strong value={dueLabel} />
        <RecapRow label="Total HT" separated value={formatPriceHT(totals.subtotalHt)} />
        {totals.totalDiscount > 0 ? (
          <RecapRow compact label="dont remises" tone={colors.ok} value={`− ${formatPriceHT(totals.totalDiscount)}`} />
        ) : null}
        {vatGroups.map((group) => (
          <RecapRow
            compact
            key={group.rate}
            label={`TVA ${formatVatRate(group.rate)} sur ${formatPriceHT(group.base)}`}
            value={formatPriceHT(group.amount)}
          />
        ))}
        <RecapRow label="Total TTC" separated strong value={formatPriceHT(totals.totalTtc)} />

        <Pressable
          accessibilityHint="Ouvre l’aperçu PDF"
          accessibilityRole="button"
          onPress={onOpenPreview}
          style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}>
          <View style={styles.previewPaper}>
            <View
              style={[
                styles.previewBand,
                { backgroundColor: isCreate ? (activeTemplate.accent ?? colors.ink) : colors.accent },
              ]}
            />
          </View>
          <View style={styles.previewText}>
            <Text maxFontSizeMultiplier={1.3} style={styles.previewTitle}>
              Voir l’aperçu du PDF
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.previewMeta}>
              {isCreate ? activeTemplate.name : 'Modèle de la facture'}
            </Text>
          </View>
          <ComposerIcon
            color={colors.ink3}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={13}
          />
        </Pressable>
      </GroupCard>
    </>
  );
}

function RecapRow({
  label,
  value,
  strong = false,
  separated = false,
  compact = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  separated?: boolean;
  compact?: boolean;
  tone?: string;
}) {
  const styles = useComposerStyles(templateStyles);
  return (
    <View style={[styles.recapRow, separated && styles.recapSeparated, compact && styles.recapCompact]}>
      <Text maxFontSizeMultiplier={1.4} style={styles.recapLabel}>
        {label}
      </Text>
      <Text
        maxFontSizeMultiplier={1.4}
        numberOfLines={1}
        style={[styles.recapValue, strong && styles.recapValueStrong, tone ? { color: tone } : null]}>
        {value}
      </Text>
    </View>
  );
}

/** Vignette schématique d'un modèle (couleur d'accent, bandeau ou liseré). */
function TemplateThumb({
  template,
  selected,
  onPress,
}: {
  template: PdfTemplateDefinition;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useComposerStyles(templateStyles);
  const colors = useComposerColors();
  const accent = template.accent ?? '#1C1B22';
  const layout = Number.parseInt(template.id, 10) % 3;

  return (
    <Pressable
      accessibilityLabel={`Modèle ${template.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.thumb, pressed && styles.pressed]}>
      <View style={[styles.thumbRing, selected && styles.thumbRingSelected]}>
        <View style={[styles.thumbPaper, { backgroundColor: template.paper || '#FFFFFF' }]}>
          {layout === 1 ? <View style={[styles.thumbBand, { backgroundColor: accent }]} /> : null}
          {layout === 2 ? <View style={[styles.thumbSide, { backgroundColor: accent }]} /> : null}
          <View
            style={[
              styles.thumbTitle,
              { backgroundColor: layout === 1 ? '#FFFFFF' : accent },
              layout === 2 ? styles.thumbIndented : null,
            ]}
          />
          <View style={[styles.thumbLine, styles.thumbMeta, layout === 2 ? styles.thumbIndented : null]} />
          <View
            style={[
              styles.thumbHead,
              { backgroundColor: template.accent ? `${accent}33` : '#ECEBEF' },
              layout === 2 ? styles.thumbIndented : null,
            ]}
          />
          {[41, 47, 53].map((top) => (
            <View
              key={top}
              style={[styles.thumbRow, { top: `${top}%` }, layout === 2 ? styles.thumbIndented : null]}
            />
          ))}
          <View style={[styles.thumbTotal, { backgroundColor: accent }]} />
        </View>
        {selected ? (
          <View style={styles.thumbCheck}>
            <ComposerIcon
              color={colors.onAccent}
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={11}
            />
          </View>
        ) : null}
      </View>
      <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.thumbName}>
        {template.name}
      </Text>
    </Pressable>
  );
}

function PresentationOptions({
  value,
  onChange,
  company,
  customNumber,
  onCustomNumberChange,
  forecastNumber,
}: {
  value: InvoicePdfOptions;
  onChange: (value: InvoicePdfOptions) => void;
  company: { siret?: string | null; vatNumber?: string | null } | null;
  customNumber: string;
  onCustomNumberChange: (value: string) => void;
  forecastNumber: string | null;
}) {
  const styles = useComposerStyles(templateStyles);
  const colors = useComposerColors();
  const [open, setOpen] = useState(false);
  const [numberMode, setNumberMode] = useState<'auto' | 'custom'>(() =>
    customNumber.trim() ? 'custom' : 'auto',
  );
  const numberField = useFieldNavigation({ enabled: open && numberMode === 'custom' });
  const titleField = useFieldNavigation({ enabled: open });
  const legalValues = formatIssuerLegalIds(company?.siret, company?.vatNumber);
  const activeTitle = value.title?.trim() || DEFAULT_INVOICE_TITLE;
  const shownIds = value.legalIds.length + (value.showEmail ? 1 : 0);

  const summary = [
    customNumber.trim() ? `N° ${customNumber.trim()}` : 'Numéro auto',
    `${shownIds} identifiant${shownIds > 1 ? 's' : ''}`,
    value.stampPosition === 'none'
      ? 'Sans tampon'
      : `Tampon ${STAMP_POSITION_LABELS[value.stampPosition].toLowerCase()}`,
  ].join(' · ');

  function toggleLegalId(id: IssuerLegalId) {
    const legalIds = value.legalIds.includes(id)
      ? value.legalIds.filter((entry) => entry !== id)
      : ISSUER_LEGAL_IDS.filter((entry) => entry === id || value.legalIds.includes(entry));
    onChange({ ...value, legalIds });
  }

  return (
    <GroupCard>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.optionsHead, pressed && styles.pressed]}>
        <View style={styles.optionsHeadText}>
          <Text maxFontSizeMultiplier={1.4} style={styles.rowTitle}>
            Options
          </Text>
          <Text maxFontSizeMultiplier={1.4} style={styles.optionsSummary}>
            {summary}
          </Text>
        </View>
        <ComposerIcon
          color={colors.ink3}
          name={
            open
              ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
              : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
          }
          size={13}
        />
      </Pressable>

      {open ? (
        <>
          <View style={styles.optionBlock}>
            <Text maxFontSizeMultiplier={1.4} style={styles.optionCaption}>
              Numéro de facture
            </Text>
            <SegmentedControl
              onChange={(mode) => {
                setNumberMode(mode);
                if (mode === 'auto') onCustomNumberChange('');
              }}
              options={[
                { value: 'auto', label: 'Automatique' },
                { value: 'custom', label: 'Personnalisé' },
              ]}
              value={numberMode}
            />
            {numberMode === 'custom' ? (
              <TextInput
                accessibilityLabel="Numéro de la facture"
                autoCapitalize="characters"
                autoFocus={!customNumber}
                maxLength={40}
                onChangeText={onCustomNumberChange}
                onSubmitEditing={numberField?.onSubmitEditing}
                placeholder={forecastNumber ?? 'FAC-2026-000001'}
                placeholderTextColor={colors.ink3}
                ref={numberField?.ref}
                returnKeyType={numberField?.returnKeyType}
                style={styles.numberInput}
                submitBehavior={numberField?.submitBehavior}
                value={customNumber}
              />
            ) : null}
            <Text maxFontSizeMultiplier={1.4} style={styles.optionHint}>
              {numberMode === 'custom'
                ? 'Chaque numéro ne peut servir qu’une fois.'
                : 'Prochain numéro : '}
              {numberMode === 'auto' ? (
                <Text style={styles.optionHintStrong}>{forecastNumber ?? 'attribué à la création'}</Text>
              ) : null}
            </Text>
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={[styles.rowTitle, styles.titleLabel]}>
                Titre du document
              </Text>
              <TextInput
                accessibilityLabel="Titre du document"
                maxLength={60}
                onChangeText={(title) => onChange({ ...value, title })}
                onSubmitEditing={titleField?.onSubmitEditing}
                placeholder={DEFAULT_INVOICE_TITLE}
                placeholderTextColor={colors.ink3}
                ref={titleField?.ref}
                returnKeyType={titleField?.returnKeyType}
                style={styles.titleInput}
                submitBehavior={titleField?.submitBehavior}
                value={value.title ?? ''}
              />
            </View>
            <ScrollView
              contentContainerStyle={styles.titleSuggestions}
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}>
              {INVOICE_TITLE_SUGGESTIONS.map((suggestion) => (
                <Pill
                  key={suggestion}
                  label={suggestion}
                  onPress={() =>
                    onChange({
                      ...value,
                      title: suggestion === DEFAULT_INVOICE_TITLE ? null : suggestion,
                    })
                  }
                  selected={activeTitle === suggestion}
                />
              ))}
            </ScrollView>
          </View>

          <Text maxFontSizeMultiplier={1.4} style={[styles.optionCaption, styles.idsCaption]}>
            Identifiants affichés
          </Text>
          {ISSUER_LEGAL_IDS.map((id) => {
            const shown = legalValues[id];
            return (
              <SwitchRow
                key={id}
                label={ISSUER_LEGAL_ID_LABELS[id]}
                missing={!shown}
                onValueChange={() => toggleLegalId(id)}
                subtitle={shown ?? 'Non renseigné (page Entreprise)'}
                value={value.legalIds.includes(id)}
              />
            );
          })}
          <SwitchRow
            label="E-mail"
            onValueChange={(showEmail) => onChange({ ...value, showEmail })}
            subtitle="Afficher mon e-mail sur la facture"
            value={value.showEmail}
          />

          <View style={styles.stampBlock}>
            <Text maxFontSizeMultiplier={1.4} style={styles.optionCaption}>
              Tampon « Facture payée »
            </Text>
            <View style={styles.stampColors}>
              {STAMP_COLORS.map((color) => {
                const selected = value.stampColor === color;
                return (
                  <Pressable
                    accessibilityLabel={`Couleur ${STAMP_COLOR_LABELS[color]}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={color}
                    onPress={() => {
                      void triggerSelectionHaptic();
                      onChange({ ...value, stampColor: color });
                    }}
                    style={({ pressed }) => [styles.stampColor, pressed && styles.pressed]}>
                    <View style={[styles.stampRing, selected && styles.stampRingSelected]}>
                      <View
                        style={[
                          styles.stampDot,
                          color === 'auto'
                            ? styles.stampDotAuto
                            : { backgroundColor: STAMP_COLOR_VALUES[color] },
                        ]}>
                        {color === 'auto' ? (
                          <Text maxFontSizeMultiplier={1.2} style={styles.stampAutoLabel}>
                            A
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Text maxFontSizeMultiplier={1.3} style={styles.stampColorLabel}>
                      {color === 'auto' ? 'Auto' : STAMP_COLOR_LABELS[color]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <SegmentedControl<StampPosition>
              columns={2}
              onChange={(stampPosition) => onChange({ ...value, stampPosition })}
              options={STAMP_POSITIONS.map((position) => ({
                value: position,
                label: STAMP_POSITION_LABELS[position],
              }))}
              value={value.stampPosition}
            />
            <Text maxFontSizeMultiplier={1.4} style={styles.optionHint}>
              Le tampon apparaît dès que la facture est payée.
            </Text>
          </View>
        </>
      ) : null}
    </GroupCard>
  );
}

function SwitchRow({
  label,
  subtitle,
  value,
  onValueChange,
  missing = false,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  missing?: boolean;
}) {
  const styles = useComposerStyles(templateStyles);
  const colors = useComposerColors();

  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text maxFontSizeMultiplier={1.4} style={styles.rowTitle}>
          {label}
        </Text>
        {subtitle ? (
          <Text
            maxFontSizeMultiplier={1.4}
            numberOfLines={1}
            style={[styles.switchSubtitle, missing && styles.switchMissing]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={`Afficher ${label}`}
        ios_backgroundColor={colors.track}
        onValueChange={onValueChange}
        thumbColor="#FFFFFF"
        trackColor={{ false: colors.track, true: colors.ok }}
        value={value}
      />
    </View>
  );
}

function templateStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.6,
    },
    bleed: {
      marginHorizontal: -16,
      flexGrow: 0,
    },
    pills: {
      flexDirection: 'row' as const,
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    strip: {
      flexDirection: 'row' as const,
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 4,
    },
    thumb: {
      width: 104,
    },
    thumbRing: {
      borderRadius: 10,
      padding: 3,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    thumbRingSelected: {
      borderColor: colors.accent,
    },
    thumbPaper: {
      width: '100%' as const,
      aspectRatio: 1 / 1.414,
      borderRadius: 6,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: 'rgba(20, 18, 40, 0.08)',
    },
    thumbBand: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      top: 0,
      height: '17%' as const,
    },
    thumbSide: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: '7%' as const,
    },
    thumbIndented: {
      left: '18%' as const,
    },
    thumbTitle: {
      position: 'absolute' as const,
      left: '10%' as const,
      top: '8%' as const,
      width: '30%' as const,
      height: '3%' as const,
      borderRadius: 1,
    },
    thumbLine: {
      position: 'absolute' as const,
      left: '10%' as const,
      backgroundColor: '#E3E2E7',
    },
    thumbMeta: {
      top: '22%' as const,
      width: '34%' as const,
      height: '1.6%' as const,
    },
    thumbHead: {
      position: 'absolute' as const,
      left: '10%' as const,
      right: '10%' as const,
      top: '34%' as const,
      height: '2.6%' as const,
    },
    thumbRow: {
      position: 'absolute' as const,
      left: '10%' as const,
      right: '10%' as const,
      height: '1.5%' as const,
      backgroundColor: '#ECEBEF',
    },
    thumbTotal: {
      position: 'absolute' as const,
      right: '10%' as const,
      top: '63%' as const,
      width: '34%' as const,
      height: '4.5%' as const,
      borderRadius: 1,
    },
    thumbCheck: {
      position: 'absolute' as const,
      top: 8,
      right: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    thumbName: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.ink,
      marginTop: 7,
      paddingLeft: 2,
    },
    notes: {
      minHeight: 78,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 12,
      borderRadius: composerRadius.card,
      backgroundColor: colors.surface,
      fontSize: 16,
      lineHeight: 23,
      color: colors.ink,
    },
    optionsHead: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    optionsHeadText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontSize: 16,
      color: colors.ink,
    },
    optionsSummary: {
      fontSize: 13.5,
      color: colors.ink3,
      marginTop: 2,
    },
    optionBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 8,
    },
    optionCaption: {
      fontSize: 14,
      color: colors.ink3,
    },
    optionHint: {
      fontSize: 13.5,
      lineHeight: 19,
      color: colors.ink3,
    },
    optionHintStrong: {
      ...tabularNums,
      color: colors.ink2,
      fontWeight: '600' as const,
    },
    numberInput: {
      ...tabularNums,
      height: 44,
      paddingHorizontal: 12,
      borderRadius: composerRadius.field,
      borderWidth: 1,
      borderColor: colors.line,
      fontSize: 16,
      color: colors.ink,
    },
    titleBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
      paddingBottom: 12,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
      minHeight: 50,
      paddingHorizontal: 16,
    },
    titleLabel: {
      flexShrink: 0,
    },
    titleInput: {
      flex: 1,
      minWidth: 80,
      minHeight: 44,
      fontSize: 16,
      color: colors.ink2,
      textAlign: 'right' as const,
    },
    titleSuggestions: {
      flexDirection: 'row' as const,
      gap: 8,
      paddingHorizontal: 16,
    },
    idsCaption: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 4,
    },
    switchRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
      minHeight: 52,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    switchText: {
      flex: 1,
      minWidth: 0,
    },
    switchSubtitle: {
      ...tabularNums,
      fontSize: 13,
      color: colors.ink3,
      marginTop: 1,
    },
    switchMissing: {
      color: colors.danger,
    },
    stampBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 14,
      gap: 12,
    },
    stampColors: {
      flexDirection: 'row' as const,
      gap: 10,
    },
    stampColor: {
      alignItems: 'center' as const,
      gap: 5,
      minWidth: 44,
    },
    stampRing: {
      padding: 2,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    stampRingSelected: {
      borderColor: colors.accent,
    },
    stampDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    stampDotAuto: {
      backgroundColor: colors.soft,
      borderWidth: 1,
      borderColor: colors.line,
    },
    stampAutoLabel: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: colors.ink2,
    },
    stampColorLabel: {
      fontSize: 12,
      color: colors.ink2,
    },
    recap: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 14,
    },
    recapRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      gap: 12,
      paddingVertical: 10,
    },
    recapCompact: {
      paddingVertical: 4,
    },
    recapSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
    },
    recapLabel: {
      ...tabularNums,
      flexShrink: 1,
      fontSize: 15,
      color: colors.ink3,
    },
    recapValue: {
      ...tabularNums,
      flexShrink: 1,
      fontSize: 15,
      color: colors.ink,
      textAlign: 'right' as const,
    },
    recapValueStrong: {
      fontWeight: '600' as const,
    },
    previewButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      marginTop: 12,
      minHeight: 56,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.soft,
    },
    previewPaper: {
      width: 30,
      height: 42,
      borderRadius: 3,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: 'rgba(20, 18, 40, 0.1)',
      overflow: 'hidden' as const,
    },
    previewBand: {
      height: 5,
    },
    previewText: {
      flex: 1,
      minWidth: 0,
    },
    previewTitle: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    previewMeta: {
      fontSize: 13,
      color: colors.ink3,
    },
  };
}
