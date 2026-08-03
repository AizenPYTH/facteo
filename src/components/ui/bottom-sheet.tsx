import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { springs } from '@/lib/motion/springs';
import { useThemePreference } from '@/providers/theme-preference-provider';

type AppBottomSheetProps = {
  /** Controlled visibility — mirrors the RN `Modal` `visible`/`onClose` pattern
   * used elsewhere in the app, so call sites migrate with a container swap only. */
  visible: boolean;
  onClose: () => void;
  /** Fixed snap points (e.g. `['60%', '92%']`). Omit to size to content. */
  snapPoints?: (string | number)[];
  children: ReactNode;
};

/**
 * INVEQ's bottom sheet primitive: real drag-to-dismiss physics, a frosted
 * glass backdrop, and a spring drawn from the shared `springs.gentle` config
 * so it feels like every other motion in the app — replaces ad hoc
 * `Modal`-based sheets (slide animation, no gesture, flat scrim).
 */
export function AppBottomSheet({ visible, onClose, snapPoints, children }: AppBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const styles = useStyles();
  const colors = useColors();
  const { colorScheme } = useThemePreference();

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.35} pressBehavior="close">
        <BlurView
          intensity={24}
          style={StyleSheet.absoluteFill}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
        />
      </BottomSheetBackdrop>
    ),
    [colorScheme],
  );

  const animationConfigs = useMemo(() => springs.gentle, []);

  return (
    <BottomSheetModal
      ref={ref}
      accessibilityViewIsModal
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      enableDynamicSizing={!snapPoints}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.borderStrong }]}
      handleStyle={styles.handle}
      index={0}
      onDismiss={onClose}
      snapPoints={snapPoints}>
      {children}
    </BottomSheetModal>
  );
}

export { BottomSheetScrollView };

function useStyles() {
  return useThemedStyles((colors) => ({
    background: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
    },
    handle: {
      paddingTop: 10,
      paddingBottom: 4,
    },
    handleIndicator: {
      width: 36,
      height: 4,
    },
  }));
}
