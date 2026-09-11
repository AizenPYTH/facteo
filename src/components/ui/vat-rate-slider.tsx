import { useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { parseVatRateInput } from '@/lib/format/decimal';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export function VatRateSlider({
  onChange,
  value,
}: {
  onChange: (next: string) => void;
  value: string;
}) {
  const colors = useColors();
  const [trackWidth, setTrackWidth] = useState(1);
  const numeric = clampVatRate(parseVatRateInput(value));

  function setFromEvent(event: GestureResponderEvent) {
    const ratio = Math.min(1, Math.max(0, event.nativeEvent.locationX / trackWidth));
    onChange(String(Math.round(ratio * 100)));
  }

  function onLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0) {
      setTrackWidth(nextWidth);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>TVA</Text>
        <Text style={[styles.value, { color: colors.text }]}>{numeric} %</Text>
      </View>
      <View
        accessibilityLabel="Taux de TVA"
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max: 100, now: numeric }}
        hitSlop={8}
        onLayout={onLayout}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={setFromEvent}
        onResponderMove={setFromEvent}
        onStartShouldSetResponder={() => true}
        style={styles.hit}>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.primary, width: `${numeric}%` },
            ]}
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              backgroundColor: colors.primary,
              left: `${numeric}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function clampVatRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.footnote,
    fontWeight: '600',
  },
  value: {
    ...typography.footnote,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  hit: {
    height: 28,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    top: 6,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
