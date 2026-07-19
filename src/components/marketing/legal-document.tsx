import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MarketingShell } from '@/components/marketing/marketing-shell';
import { MarketingSeo } from '@/components/marketing/marketing-seo';
import { LEGAL_CONTACT } from '@/constants/marketing/legal-content';
import {
  marketingColors,
  marketingSpacing,
  marketingText,
  marketingTypography,
} from '@/constants/marketing/theme';
import { openExternalUrl, openLegalPage } from '@/lib/legal/open-legal-page';
import { MARKETING_CONTACT } from '@/constants/marketing/site';

export type LegalSection = {
  id?: string;
  title: string;
  paragraphs: string[];
  links?: ReadonlyArray<{ label: string; href: string }>;
};

type LegalDocumentProps = {
  title: string;
  subtitle?: string;
  description: string;
  path: string;
  lastUpdated: string;
  sections: LegalSection[];
  children?: ReactNode;
};

export function LegalDocument({
  title,
  subtitle,
  description,
  path,
  lastUpdated,
  sections,
}: LegalDocumentProps) {
  const router = useRouter();

  function navigateTo(href: string) {
    if (href === '/privacy') {
      void openLegalPage('privacy');
      return;
    }
    if (href === '/terms') {
      void openLegalPage('terms');
      return;
    }
    if (href === '/legal') {
      void openLegalPage('legal');
      return;
    }
    if (href === '/cookies') {
      void openLegalPage('cookies');
      return;
    }
    router.push(href as '/');
  }

  return (
    <>
      <MarketingSeo description={description} path={path} title={`${title} — FACTEO`} />
      <MarketingShell>
        <View style={styles.page}>
          <View style={styles.hero}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <Text style={styles.updated}>Dernière mise à jour : {lastUpdated}</Text>
          </View>

          <View style={styles.layout}>
            <View style={styles.toc}>
              <Text style={styles.tocTitle}>Sommaire</Text>
              {sections.map((section) => (
                <Pressable
                  accessibilityRole="link"
                  key={section.title}
                  onPress={() => {
                    if (typeof document !== 'undefined' && section.id) {
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  style={styles.tocItem}>
                  <Text style={styles.tocLink}>{section.title}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.content}>
              {sections.map((section) => (
                <View
                  key={section.title}
                  nativeID={section.id}
                  style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.paragraphs.map((paragraph) => (
                    <Text key={paragraph.slice(0, 48)} style={styles.paragraph}>
                      {paragraph}
                    </Text>
                  ))}
                  {section.links?.map((link) => (
                    <Pressable
                      accessibilityRole="link"
                      key={link.href}
                      onPress={() => navigateTo(link.href)}
                      style={styles.inlineLink}>
                      <Text style={styles.inlineLinkText}>{link.label} →</Text>
                    </Pressable>
                  ))}
                </View>
              ))}

              <View style={styles.contactCard}>
                <Text style={styles.contactTitle}>Contact FACTEO</Text>
                <Text style={styles.contactText}>
                  {LEGAL_CONTACT.company} — {LEGAL_CONTACT.website}
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() =>
                    void openExternalUrl(`mailto:${MARKETING_CONTACT.email}`)
                  }
                  style={styles.contactLink}>
                  <Text style={styles.contactLinkText}>{LEGAL_CONTACT.email}</Text>
                </Pressable>
                <Text style={styles.contactText}>Support : {LEGAL_CONTACT.support}</Text>
              </View>

              <View style={styles.related}>
                <Text style={styles.relatedTitle}>Documents connexes</Text>
                <View style={styles.relatedLinks}>
                  <LegalNavLink href="/privacy" label="Confidentialité" onPress={navigateTo} />
                  <LegalNavLink href="/terms" label="CGU" onPress={navigateTo} />
                  <LegalNavLink href="/legal" label="Mentions légales" onPress={navigateTo} />
                  <LegalNavLink href="/cookies" label="Cookies" onPress={navigateTo} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </MarketingShell>
    </>
  );
}

function LegalNavLink({
  label,
  href,
  onPress,
}: {
  label: string;
  href: string;
  onPress: (href: string) => void;
}) {
  return (
    <Pressable accessibilityRole="link" onPress={() => onPress(href)} style={styles.navChip}>
      <Text style={styles.navChipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    maxWidth: 1080,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: marketingSpacing.lg,
    paddingVertical: marketingSpacing.xxl,
    gap: marketingSpacing.xxl,
  },
  hero: {
    gap: marketingSpacing.sm,
    paddingBottom: marketingSpacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: marketingColors.border,
  },
  title: marketingText({
    ...marketingTypography.h1,
    color: marketingColors.text,
  }),
  subtitle: marketingText({
    ...marketingTypography.bodyLarge,
    color: marketingColors.textSecondary,
    maxWidth: 640,
  }),
  updated: marketingText({
    ...marketingTypography.caption,
    color: marketingColors.textMuted,
    marginTop: marketingSpacing.xs,
  }),
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: marketingSpacing.xxl,
    alignItems: 'flex-start',
  },
  toc: {
    width: 240,
    flexShrink: 0,
    gap: marketingSpacing.xs,
    position: 'sticky' as const,
    top: marketingSpacing.xl,
  },
  tocTitle: marketingText({
    ...marketingTypography.overline,
    color: marketingColors.textMuted,
    marginBottom: marketingSpacing.sm,
  }),
  tocItem: {
    paddingVertical: 6,
  },
  tocLink: marketingText({
    ...marketingTypography.caption,
    color: marketingColors.primary,
  }),
  content: {
    flex: 1,
    minWidth: 280,
    gap: marketingSpacing.xl,
  },
  section: {
    gap: marketingSpacing.md,
    paddingTop: marketingSpacing.sm,
  },
  sectionTitle: marketingText({
    ...marketingTypography.h3,
    color: marketingColors.text,
  }),
  paragraph: marketingText({
    ...marketingTypography.body,
    color: marketingColors.textSecondary,
    lineHeight: 26,
  }),
  inlineLink: {
    alignSelf: 'flex-start',
    marginTop: marketingSpacing.xs,
  },
  inlineLinkText: marketingText({
    ...marketingTypography.caption,
    color: marketingColors.primary,
    fontWeight: '600',
  }),
  contactCard: {
    backgroundColor: marketingColors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
    padding: marketingSpacing.xl,
    gap: marketingSpacing.sm,
    marginTop: marketingSpacing.lg,
  },
  contactTitle: marketingText({
    ...marketingTypography.h3,
    color: marketingColors.text,
  }),
  contactText: marketingText({
    ...marketingTypography.body,
    color: marketingColors.textSecondary,
  }),
  contactLink: {
    alignSelf: 'flex-start',
  },
  contactLinkText: marketingText({
    ...marketingTypography.caption,
    color: marketingColors.primary,
    fontWeight: '600',
  }),
  related: {
    gap: marketingSpacing.md,
    paddingTop: marketingSpacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: marketingColors.border,
  },
  relatedTitle: marketingText({
    ...marketingTypography.overline,
    color: marketingColors.textMuted,
  }),
  relatedLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: marketingSpacing.sm,
  },
  navChip: {
    backgroundColor: marketingColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
    borderRadius: 999,
    paddingHorizontal: marketingSpacing.md,
    paddingVertical: marketingSpacing.sm,
  },
  navChipText: marketingText({
    ...marketingTypography.caption,
    color: marketingColors.text,
    fontWeight: '600',
  }),
});
