import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { FOOTER_LINKS } from '@/constants/marketing/content';
import { MARKETING_CONTACT } from '@/constants/marketing/site';
import {
  marketingColors,
  marketingSpacing,
  marketingText,
  marketingTypography,
} from '@/constants/marketing/theme';

export function MarketingFooter() {
  const router = useRouter();
  const year = new Date().getFullYear();

  function openLink(href: string) {
    if (href.startsWith('mailto:')) {
      void Linking.openURL(href);
      return;
    }

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
    <View accessibilityRole="none" style={styles.footer}>
      <View style={styles.inner}>
        <View style={styles.brandColumn}>
          <Text style={styles.brand}>FACTEO</Text>
          <Text style={styles.tagline}>
            La facturation moderne pour artisans, freelances et PME.
          </Text>
          <Text style={styles.contact}>{MARKETING_CONTACT.email}</Text>
        </View>

        <FooterColumn
          links={FOOTER_LINKS.product}
          onLinkPress={openLink}
          title="Produit"
        />
        <FooterColumn
          links={FOOTER_LINKS.company}
          onLinkPress={openLink}
          title="Entreprise"
        />
        <FooterColumn links={FOOTER_LINKS.legal} onLinkPress={openLink} title="Légal" />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.copyright}>© {year} FACTEO. Tous droits réservés.</Text>
      </View>
    </View>
  );
}

function FooterColumn({
  title,
  links,
  onLinkPress,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
  onLinkPress: (href: string) => void;
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnTitle}>{title}</Text>
      {links.map((link) => (
        <Pressable
          accessibilityRole="link"
          key={link.label}
          onPress={() => onLinkPress(link.href)}
          style={styles.link}>
          <Text style={styles.linkText}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: marketingColors.text,
    paddingTop: marketingSpacing.sectionMobile,
    paddingBottom: marketingSpacing.xl,
    marginTop: marketingSpacing.sectionMobile,
  },
  inner: {
    maxWidth: marketingSpacing.container,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: marketingSpacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: marketingSpacing.xxl,
  },
  brandColumn: {
    flex: 1,
    minWidth: 220,
    gap: marketingSpacing.sm,
  },
  brand: marketingText({
    ...marketingTypography.h3,
    color: marketingColors.textInverse,
    fontWeight: '700',
  }),
  tagline: marketingText({
    ...marketingTypography.body,
    color: 'rgba(255,255,255,0.7)',
    maxWidth: 280,
  }),
  contact: marketingText({
    ...marketingTypography.caption,
    color: 'rgba(255,255,255,0.5)',
  }),
  column: {
    minWidth: 140,
    gap: marketingSpacing.sm,
  },
  columnTitle: marketingText({
    ...marketingTypography.overline,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: marketingSpacing.xs,
  }),
  link: {
    paddingVertical: 4,
  },
  linkText: marketingText({
    ...marketingTypography.caption,
    color: 'rgba(255,255,255,0.85)',
  }),
  bottom: {
    maxWidth: marketingSpacing.container,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: marketingSpacing.lg,
    marginTop: marketingSpacing.xxl,
    paddingTop: marketingSpacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  copyright: marketingText({
    ...marketingTypography.caption,
    color: 'rgba(255,255,255,0.45)',
  }),
});
