import { useWindowDimensions } from 'react-native';

/**
 * React Native exposes the current Dynamic Type scale through window
 * dimensions. Values above 1.2 correspond to content sizes beyond Large.
 */
export function useIsLargeContentSize(): boolean {
  const { fontScale } = useWindowDimensions();

  return fontScale > 1.2;
}
