import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function BrandLogo({ size = 88, style, testID }: BrandLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
      <Image
        accessibilityIgnoresInvertColors
        contentFit="contain"
        source={require('@/assets/images/factume-logo.png')}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
