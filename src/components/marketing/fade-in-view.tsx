import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

type FadeInViewProps = {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
};

export function FadeInView({ children, delay = 0, style }: FadeInViewProps) {
  const ref = useRef<View>(null);
  const [visible, setVisible] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const node = ref.current as unknown as Element | null;

    if (!node) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <View
      ref={ref}
      style={[
        style,
        Platform.OS === 'web' && {
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(24px)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '600ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          transitionDelay: `${delay}ms`,
        },
      ]}>
      {children}
    </View>
  );
}
