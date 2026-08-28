import { useId } from 'react';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

/** Official brand gradient — constant across themes. */
export const INVEQ_GRADIENT = {
  start: '#B026FF',
  end: '#2F7CF6',
} as const;

type InveqMarkProps = {
  size?: number;
  /** Detail color on the document (lines / euro). Dark ink for contrast on the gradient. */
  detailColor?: string;
  accessibilityLabel?: string;
};

/**
 * Official INVEQ mark (document + €) as SVG — crisp at any density.
 * Gradient is brand-fixed; inner details stay dark for contrast on the fill.
 */
export function InveqMark({
  size = 40,
  detailColor = '#0B1220',
  accessibilityLabel = 'INVEQ',
}: InveqMarkProps) {
  const gradId = `inveq-mark-${useId().replace(/:/g, '')}`;
  const height = size;
  const width = size * (72 / 88);

  return (
    <Svg
      accessibilityLabel={accessibilityLabel}
      height={height}
      viewBox="0 0 72 88"
      width={width}>
      <Defs>
        <LinearGradient id={gradId} x1="36" x2="36" y1="4" y2="84" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={INVEQ_GRADIENT.start} />
          <Stop offset="1" stopColor={INVEQ_GRADIENT.end} />
        </LinearGradient>
      </Defs>

      {/* Document body with folded top-right corner */}
      <Path
        d="M14 8C14 5.79086 15.7909 4 18 4H46L62 20V80C62 82.2091 60.2091 84 58 84H18C15.7909 84 14 82.2091 14 80V8Z"
        fill={`url(#${gradId})`}
      />

      {/* Fold face */}
      <Path d="M46 4L62 20H50C47.7909 20 46 18.2091 46 16V4Z" fill="rgba(255,255,255,0.32)" />

      {/* Fold edge */}
      <Path
        d="M46 4V16C46 18.2091 47.7909 20 50 20"
        fill="none"
        stroke="rgba(11,18,32,0.18)"
        strokeWidth={1.2}
      />

      {/* Text lines */}
      <Rect x="24" y="30" width="24" height="3.2" rx="1.6" fill={detailColor} opacity={0.9} />
      <Rect x="24" y="38.5" width="19" height="3.2" rx="1.6" fill={detailColor} opacity={0.9} />
      <Rect x="24" y="47" width="14" height="3.2" rx="1.6" fill={detailColor} opacity={0.9} />

      {/* Euro */}
      <SvgText
        fill={detailColor}
        fontFamily="System"
        fontSize="20"
        fontWeight="700"
        letterSpacing={-0.5}
        opacity={0.95}
        textAnchor="middle"
        x="44"
        y="72">
        €
      </SvgText>
    </Svg>
  );
}
