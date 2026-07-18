import { useEffect, useMemo, useRef } from 'react';
import { Animated, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type VoiceWaveAnimationProps = {
  active: boolean;
};

const BAR_COUNT = 5;

export function VoiceWaveAnimation({ active }: VoiceWaveAnimationProps) {
  const styles = useStyles();
  const animatedValues = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3)),
    [],
  );
  const loops = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loops.current.forEach((loop) => loop.stop());
    loops.current = [];

    if (!active) {
      animatedValues.forEach((value) => {
        value.setValue(0.3);
      });
      return;
    }

    loops.current = animatedValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 80),
          Animated.timing(value, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.25,
            duration: 420,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    loops.current.forEach((loop) => loop.start());

    return () => {
      loops.current.forEach((loop) => loop.stop());
      loops.current = [];
    };
  }, [active, animatedValues]);

  return (
    <View style={styles.container}>
      {animatedValues.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              transform: [{ scaleY: value }],
              opacity: value,
            },
          ]}
        />
      ))}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      height: 42,
    },
    bar: {
      width: 6,
      height: 30,
      borderRadius: 9999,
      backgroundColor: colors.primary,
    },
  }));
}
