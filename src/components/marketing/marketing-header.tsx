import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MarketingButton } from '@/components/marketing/marketing-button';
import {
  marketingColors,
  marketingRadius,
  marketingSpacing,
  marketingText,
  marketingTypography,
} from '@/constants/marketing/theme';

const NAV_ITEMS = [
  { label: 'Fonctionnalités', href: '/#features' },
  { label: 'Tarifs', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
] as const;

type MarketingHeaderProps = {
  isWide: boolean;
};

export function MarketingHeader({ isWide }: MarketingHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function navigateTo(href: string) {
    setMenuOpen(false);

    if (href.startsWith('/#')) {
      if (typeof window !== 'undefined' && window.location.pathname === '/') {
        const id = href.replace('/#', '');
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      router.push(href as '/');
      return;
    }

    router.push(href as '/');
  }

  return (
    <View accessibilityRole="header" style={styles.header}>
      <View style={styles.inner}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/')} style={styles.brand}>
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require('@/assets/images/INVEQ-logo.png')}
            style={styles.logo}
          />
          <Text style={styles.brandName}>INVEQ</Text>
        </Pressable>

        {isWide ? (
          <View style={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <Pressable
                accessibilityRole="link"
                key={item.label}
                onPress={() => navigateTo(item.href)}
                style={styles.navLink}>
                <Text style={styles.navLinkText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable
            accessibilityLabel={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onPress={() => setMenuOpen((open) => !open)}
            style={styles.menuButton}>
            <Text style={styles.menuButtonText}>{menuOpen ? '✕' : '☰'}</Text>
          </Pressable>
        )}

        <View style={isWide ? styles.actions : styles.actionsCompact}>
          {isWide ? <MarketingButton href="/login" label="Connexion" variant="ghost" /> : null}
          <MarketingButton href="/register" label={isWide ? 'Essayer gratuitement' : 'Essayer'} variant="primary" />
        </View>
      </View>

      {!isWide && menuOpen ? (
        <View style={styles.mobileMenu}>
          {NAV_ITEMS.map((item) => (
            <Pressable key={item.label} onPress={() => navigateTo(item.href)} style={styles.mobileLink}>
              <Text style={styles.mobileLinkText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'sticky' as unknown as 'absolute',
    top: 0,
    zIndex: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: marketingColors.border,
    ...(typeof window !== 'undefined'
      ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
      : {}),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: marketingSpacing.container,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: marketingSpacing.lg,
    paddingVertical: marketingSpacing.md,
    gap: marketingSpacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: marketingSpacing.sm,
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandName: marketingText({
    ...marketingTypography.h3,
    color: marketingColors.text,
    fontWeight: '700',
  }),
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: marketingSpacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    paddingVertical: marketingSpacing.sm,
    paddingHorizontal: marketingSpacing.sm,
  },
  navLinkText: marketingText({
    ...marketingTypography.caption,
    color: marketingColors.textSecondary,
    fontWeight: '500',
  }),
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: marketingSpacing.sm,
  },
  actionsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: marketingRadius.sm,
    backgroundColor: marketingColors.backgroundAlt,
  },
  menuButtonText: {
    fontSize: 18,
    color: marketingColors.text,
  },
  mobileMenu: {
    paddingHorizontal: marketingSpacing.lg,
    paddingBottom: marketingSpacing.md,
    gap: marketingSpacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: marketingColors.border,
  },
  mobileLink: {
    paddingVertical: marketingSpacing.md,
  },
  mobileLinkText: marketingText({
    ...marketingTypography.body,
    color: marketingColors.text,
    fontWeight: '500',
  }),
});
