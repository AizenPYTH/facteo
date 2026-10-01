import { FONTS } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition, TemplateCategory } from '@/lib/pdf/engine/templates/types';
import type { VocabularyId } from '@/lib/pdf/engine/templates/vocabulary';

type FontKey = keyof typeof FONTS;

export type TemplateVariantSpec = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  vocabulary: VocabularyId;
  /** Couleurs du modèle de base (hexadécimal) remplacées par d'autres. */
  colors?: Record<string, string>;
  /** Polices du modèle de base remplacées par d'autres. */
  fonts?: Partial<Record<FontKey, FontKey>>;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Variante d'un modèle : même structure, mais palette, typographie et
 * vocabulaire propres. Les substitutions portent sur le HTML rendu par le
 * modèle de base, avant l'ajout du cachet et du bandeau communs.
 */
export function createTemplateVariant(
  base: PdfTemplateDefinition,
  spec: TemplateVariantSpec,
): PdfTemplateDefinition {
  const swaps: [RegExp, string][] = [
    ...Object.entries(spec.colors ?? {}).map(
      ([from, to]) => [new RegExp(escapeRegExp(from), 'gi'), to] as [RegExp, string],
    ),
    ...Object.entries(spec.fonts ?? {}).map(
      ([from, to]) =>
        [new RegExp(escapeRegExp(FONTS[from as FontKey]), 'g'), FONTS[to as FontKey]] as [RegExp, string],
    ),
  ];
  const recolor = (value: string | null): string | null => {
    if (!value) {
      return value;
    }
    const match = Object.entries(spec.colors ?? {}).find(
      ([from]) => from.toLowerCase() === value.toLowerCase(),
    );
    return match ? match[1] : value;
  };

  return {
    ...base,
    id: spec.id,
    name: spec.name,
    description: spec.description,
    category: spec.category,
    vocabulary: spec.vocabulary,
    accent: recolor(base.accent),
    paper: recolor(base.paper) ?? base.paper,
    baseId: base.baseId ?? base.id,
    render: (context) => swaps.reduce((html, [pattern, to]) => html.replace(pattern, to), base.render(context)),
  };
}
