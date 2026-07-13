import { View, type StyleProp, type ViewStyle } from 'react-native';

type KeyboardDismissViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Conteneur flex sans capture de gestes — le scroll reste fluide. */
export function KeyboardDismissView({ children, style }: KeyboardDismissViewProps) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}
