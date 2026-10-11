import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';

import {
  ComposerSheet,
  PrimaryButton,
  SegmentedControl,
} from '@/components/composer/primitives';
import { useComposerColors, useComposerStyles, type ComposerColors } from '@/constants/theme/composer';
import { triggerSelectionHaptic } from '@/lib/haptics';
import {
  formatIssuerLegalIds,
  issuerLegalIdLabel,
  ISSUER_LEGAL_IDS,
  LEGAL_IDS_PLACEMENT_LABELS,
  type IssuerLegalId,
  type LegalIdsPlacement,
} from '@/types/pdf-options';

/** A4 à 96 DPI, comme le moteur PDF. */
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const DEFAULT_POINT = { x: 0.06, y: 0.025 };
/** Cadre pointillé autour du bloc : bordure + marge intérieure. */
const BLOCK_INSET_X = 3.5;
const BLOCK_INSET_Y = 2.5;

type Point = { x: number; y: number };
type PlacementMode = 'auto' | 'top' | 'bottom' | 'free';

export type LegalIdEntry = { label: string; value: string };

/** Identifiants réellement imprimés : cochés et renseignés dans l'entreprise. */
export function legalIdEntries(
  legalIds: IssuerLegalId[],
  company: {
    siret?: string | null;
    vatNumber?: string | null;
    siren?: string | null;
    country?: string | null;
  } | null,
): LegalIdEntry[] {
  const values = formatIssuerLegalIds(
    company?.siret,
    company?.vatNumber,
    company?.siren,
    company?.country,
  );
  return ISSUER_LEGAL_IDS.filter((id) => legalIds.includes(id) && values[id]).map((id) => ({
    label: issuerLegalIdLabel(id, company?.country),
    value: values[id] as string,
  }));
}

function clamp(value: number, max: number): number {
  return Math.min(Math.max(0, max), Math.max(0, value));
}

/** La page se cale sur la largeur de l'écran, sans zoom ni défilement. */
function fitPageHtml(html: string, scale: number): string {
  const viewport = `<meta name="viewport" content="width=${A4_WIDTH}, initial-scale=${scale}, maximum-scale=${scale}, user-scalable=no" />`;
  return /<meta name="viewport"[^>]*>/.test(html)
    ? html.replace(/<meta name="viewport"[^>]*>/, viewport)
    : html.replace('<head>', `<head>${viewport}`);
}

/**
 * Emplacement des SIREN / SIRET / TVA : selon le modèle, en haut, en bas, ou
 * « Où je veux » (la facture s'ouvre, on fait glisser le bloc, Enregistrer).
 */
export function LegalIdsPlacementControl({
  value,
  onChange,
  entries,
  buildBackgroundHtml,
}: {
  value: LegalIdsPlacement;
  onChange: (value: LegalIdsPlacement) => void;
  /** Identifiants réellement imprimés (cochés et renseignés). */
  entries: LegalIdEntry[];
  /** La facture sans ces identifiants, en HTML. */
  buildBackgroundHtml: () => Promise<string>;
}) {
  const styles = useComposerStyles(placementStyles);
  const [editing, setEditing] = useState(false);
  const mode: PlacementMode = typeof value === 'object' ? 'free' : value;

  return (
    <View style={styles.control}>
      <Text maxFontSizeMultiplier={1.4} style={styles.caption}>
        Emplacement du SIREN, SIRET et TVA
      </Text>
      <SegmentedControl<PlacementMode>
        columns={2}
        onChange={(next) => {
          if (next === 'free') {
            setEditing(true);
          } else {
            onChange(next);
          }
        }}
        options={(['auto', 'top', 'bottom', 'free'] as const).map((entry) => ({
          value: entry,
          label: LEGAL_IDS_PLACEMENT_LABELS[entry],
        }))}
        value={mode}
      />
      {mode === 'free' ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setEditing(true)}>
          <Text maxFontSizeMultiplier={1.4} style={styles.link}>
            Placé à la main · Modifier l’endroit
          </Text>
        </Pressable>
      ) : null}
      <LegalIdsPlacementSheet
        buildBackgroundHtml={buildBackgroundHtml}
        entries={entries}
        initial={typeof value === 'object' ? value : null}
        onClose={() => setEditing(false)}
        onSave={(point) => {
          onChange(point);
          setEditing(false);
        }}
        visible={editing}
      />
    </View>
  );
}

function LegalIdsPlacementSheet({
  visible,
  initial,
  entries,
  buildBackgroundHtml,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: Point | null;
  entries: LegalIdEntry[];
  buildBackgroundHtml: () => Promise<string>;
  onClose: () => void;
  onSave: (point: Point) => void;
}) {
  return (
    <ComposerSheet onClose={onClose} title="Placer le SIREN, le SIRET et la TVA" visible={visible}>
      {visible ? (
        <PlacementEditor
          buildBackgroundHtml={buildBackgroundHtml}
          entries={entries}
          initial={initial}
          onSave={onSave}
        />
      ) : null}
    </ComposerSheet>
  );
}

function PlacementEditor({
  initial,
  entries,
  buildBackgroundHtml,
  onSave,
}: {
  initial: Point | null;
  entries: LegalIdEntry[];
  buildBackgroundHtml: () => Promise<string>;
  onSave: (point: Point) => void;
}) {
  const styles = useComposerStyles(placementStyles);
  const colors = useComposerColors();
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [blockSize, setBlockSize] = useState({ width: 0, height: 0 });
  const [point, setPoint] = useState<Point>(initial ?? DEFAULT_POINT);

  // Point au début du geste : le déplacement s'y ajoute.
  const [dragStart, setDragStart] = useState<Point | null>(null);

  // Fond chargé une seule fois à l'ouverture (la fonction change à chaque rendu du parent).
  const [loadBackground] = useState(() => buildBackgroundHtml);

  useEffect(() => {
    let cancelled = false;
    loadBackground().then(
      (next) => {
        if (!cancelled) setHtml(next);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadBackground]);

  // Page A4 entière dans la place disponible.
  const pageWidth =
    area.width > 0 && area.height > 0
      ? Math.min(area.width, (area.height * A4_WIDTH) / A4_HEIGHT)
      : 0;
  const pageHeight = (pageWidth * A4_HEIGHT) / A4_WIDTH;
  const scale = pageWidth / A4_WIDTH;

  function clampPoint(next: Point): Point {
    if (pageWidth === 0) return next;
    return {
      x: Math.round(clamp(next.x, 1 - blockSize.width / pageWidth) * 10000) / 10000,
      y: Math.round(clamp(next.y, 1 - blockSize.height / pageHeight) * 10000) / 10000,
    };
  }

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin(() => {
      setDragStart(point);
      void triggerSelectionHaptic();
    })
    .onUpdate((event) => {
      if (pageWidth === 0) return;
      const start = dragStart ?? point;
      setPoint(
        clampPoint({
          x: start.x + event.translationX / pageWidth,
          y: start.y + event.translationY / pageHeight,
        }),
      );
    })
    .onFinalize(() => setDragStart(null));

  function onAreaLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  }

  function onBlockLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBlockSize({ width, height });
  }

  const pageHtml = html && scale > 0 ? fitPageHtml(html, scale) : null;

  return (
    <GestureHandlerRootView style={styles.editor}>
      <Text maxFontSizeMultiplier={1.4} style={styles.hint}>
        {entries.length > 0
          ? 'Faites glisser le bloc à l’endroit voulu, puis enregistrez.'
          : 'Aucun identifiant à placer : activez le SIREN, le SIRET ou la TVA (renseignés dans Entreprise).'}
      </Text>
      <View onLayout={onAreaLayout} style={styles.area}>
        {pageWidth > 0 ? (
          <View style={[styles.page, { width: pageWidth, height: pageHeight }]}>
            {pageHtml ? (
              <View pointerEvents="none" style={styles.fill}>
                <WebView
                  originWhitelist={['*']}
                  scrollEnabled={false}
                  source={{ html: pageHtml }}
                  style={styles.webView}
                />
              </View>
            ) : (
              <View style={styles.loading}>
                {failed ? (
                  <Text style={styles.hint}>Aperçu indisponible. Réessayez.</Text>
                ) : (
                  <ActivityIndicator color={colors.accent} />
                )}
              </View>
            )}
            {entries.length > 0 ? (
              <GestureDetector gesture={pan}>
              <View
                accessibilityHint="Faites glisser pour déplacer"
                accessibilityLabel="Bloc SIREN, SIRET et TVA"
                hitSlop={{ top: 22, bottom: 22, left: 12, right: 12 }}
                onLayout={onBlockLayout}
                style={[
                  styles.block,
                  {
                    left: point.x * pageWidth - BLOCK_INSET_X,
                    top: point.y * pageHeight - BLOCK_INSET_Y,
                    gap: 18 * scale,
                  },
                ]}>
                {entries.map((entry) => (
                  <Text key={entry.label} numberOfLines={1} style={styles.entry}>
                    <Text
                      style={[
                        styles.entryLabel,
                        { fontSize: 8.5 * scale, letterSpacing: 0.68 * scale },
                      ]}>
                      {entry.label.toUpperCase()}
                    </Text>
                    <Text style={[styles.entryValue, { fontSize: 9.5 * scale }]}>
                      {` ${entry.value}`}
                    </Text>
                  </Text>
                ))}
              </View>
              </GestureDetector>
            ) : null}
          </View>
        ) : null}
      </View>
      <PrimaryButton
        disabled={entries.length === 0}
        label="Enregistrer"
        onPress={() => onSave(clampPoint(point))}
      />
    </GestureHandlerRootView>
  );
}

function placementStyles(colors: ComposerColors) {
  return {
    control: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.line2,
    },
    caption: {
      fontSize: 14,
      color: colors.ink3,
    },
    link: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.accent,
      paddingVertical: 4,
    },
    editor: {
      flex: 1,
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 16,
    },
    hint: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink3,
      textAlign: 'center' as const,
    },
    area: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    page: {
      backgroundColor: colors.paper,
      borderRadius: 4,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    fill: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
    webView: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    loading: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    block: {
      position: 'absolute' as const,
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      paddingHorizontal: 2,
      paddingVertical: 1,
      borderRadius: 3,
      borderWidth: 1.5,
      borderStyle: 'dashed' as const,
      borderColor: colors.accent,
      backgroundColor: 'rgba(79, 70, 229, 0.10)',
    },
    entry: {
      flexShrink: 0,
    },
    entryLabel: {
      color: '#8A8A99',
    },
    entryValue: {
      fontWeight: '600' as const,
      color: '#3A3A46',
    },
  };
}
