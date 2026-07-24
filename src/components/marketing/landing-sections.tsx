import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/marketing/fade-in-view';
import { MarketingButton } from '@/components/marketing/marketing-button';
import {
  CTA_CONTENT,
  FAQ_CONTENT,
  FEATURES_CONTENT,
  HERO_CONTENT,
  MOBILE_CONTENT,
  PRICING_CONTENT,
  PRESENTATION_CONTENT,
  TESTIMONIALS_CONTENT,
  WHY_CONTENT,
} from '@/constants/marketing/content';
import {
  marketingColors,
  marketingRadius,
  marketingShadow,
  marketingSpacing,
  marketingText,
  marketingTypography,
} from '@/constants/marketing/theme';
import { FeatureIcon, MarketingSection } from '@/components/marketing/marketing-section';

export function HeroSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <LinearGradient
      colors={['#EFF6FF', '#FAFBFC', '#FFFFFF']}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.hero}>
      <View style={styles.heroInner}>
        <FadeInView style={styles.heroContent}>
          <Text style={styles.overline}>{HERO_CONTENT.overline}</Text>
          <Text accessibilityRole="header" style={isMobile ? styles.heroTitleMobile : styles.heroTitle}>
            {HERO_CONTENT.title}
          </Text>
          <Text style={styles.heroSubtitle}>{HERO_CONTENT.subtitle}</Text>
          <View style={styles.heroActions}>
            <MarketingButton href="/register" label={HERO_CONTENT.ctaPrimary} variant="primary" />
            <MarketingButton
              href="/#features"
              label={HERO_CONTENT.ctaSecondary}
              variant="secondary"
            />
          </View>
        </FadeInView>

        <FadeInView delay={150} style={styles.heroVisual}>
          <View style={styles.mockDashboard}>
            <View style={styles.mockBar} />
            <View style={styles.mockGrid}>
              <View style={styles.mockCard} />
              <View style={styles.mockCard} />
              <View style={styles.mockCardWide} />
            </View>
          </View>
        </FadeInView>
      </View>
    </LinearGradient>
  );
}

export function PresentationSection() {
  return (
    <MarketingSection
      id="presentation"
      subtitle={PRESENTATION_CONTENT.subtitle}
      title={PRESENTATION_CONTENT.title}>
      <View style={styles.bulletGrid}>
        {PRESENTATION_CONTENT.bullets.map((bullet, index) => (
          <FadeInView delay={index * 80} key={bullet} style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{bullet}</Text>
          </FadeInView>
        ))}
      </View>
    </MarketingSection>
  );
}

export function WhySection() {
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 640 ? 2 : 1;

  return (
    <MarketingSection
      alt
      id="why"
      subtitle={WHY_CONTENT.subtitle}
      title={WHY_CONTENT.title}>
      <View style={[styles.cardGrid, { flexDirection: columns === 1 ? 'column' : 'row', flexWrap: 'wrap' }]}>
        {WHY_CONTENT.items.map((item, index) => (
          <FadeInView
            delay={index * 60}
            key={item.title}
            style={StyleSheet.flatten([
              styles.featureCard,
              {
                width: columns === 4 ? '23%' : columns === 2 ? '48%' : '100%',
                minWidth: columns === 1 ? undefined : 200,
              },
            ])}>
            <FeatureIcon glyph={item.icon} />
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </FadeInView>
        ))}
      </View>
    </MarketingSection>
  );
}

export function FeaturesSection() {
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 640 ? 2 : 1;

  return (
    <MarketingSection
      id="features"
      subtitle={FEATURES_CONTENT.subtitle}
      title={FEATURES_CONTENT.title}>
      <View style={[styles.cardGrid, { flexWrap: 'wrap' }]}>
        {FEATURES_CONTENT.items.map((item, index) => (
          <FadeInView
            delay={index * 50}
            key={item.title}
            style={StyleSheet.flatten([
              styles.featureCard,
              {
                width: columns === 4 ? '23%' : columns === 2 ? '48%' : '100%',
                minWidth: columns === 1 ? undefined : 220,
              },
            ])}>
            <FeatureIcon glyph={item.icon} />
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </FadeInView>
        ))}
      </View>
    </MarketingSection>
  );
}

export function MobileSection() {
  return (
    <MarketingSection
      alt
      id="mobile"
      subtitle={MOBILE_CONTENT.subtitle}
      title={MOBILE_CONTENT.title}>
      <View style={styles.mobileRow}>
        <FadeInView style={styles.phoneMock}>
          <View style={styles.phoneScreen}>
            <View style={styles.phoneHeader} />
            <View style={styles.phoneLine} />
            <View style={styles.phoneLineShort} />
            <View style={styles.phoneCard} />
          </View>
        </FadeInView>
        <View style={styles.mobileHighlights}>
          {MOBILE_CONTENT.highlights.map((item) => (
            <View key={item} style={styles.highlightRow}>
              <Text style={styles.highlightCheck}>✓</Text>
              <Text style={styles.highlightText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </MarketingSection>
  );
}

export function ScreenshotsSection() {
  const placeholders = ['Tableau de bord', 'Liste clients', 'Création devis', 'Aperçu PDF'];

  return (
    <MarketingSection id="screenshots" subtitle="Aperçu de l’interface INVEQ" title="Captures d’écran">
      <View style={styles.screenshotGrid}>
        {placeholders.map((label, index) => (
          <FadeInView delay={index * 80} key={label} style={styles.screenshotCard}>
            <View style={styles.screenshotPlaceholder}>
              <Text style={styles.screenshotLabel}>{label}</Text>
            </View>
          </FadeInView>
        ))}
      </View>
    </MarketingSection>
  );
}

export function TestimonialsSection() {
  return (
    <MarketingSection alt id="testimonials" subtitle={TESTIMONIALS_CONTENT.subtitle} title={TESTIMONIALS_CONTENT.title}>
      <View style={styles.cardGrid}>
        {TESTIMONIALS_CONTENT.items.map((item, index) => (
          <FadeInView delay={index * 80} key={item.author} style={styles.testimonialCard}>
            <Text style={styles.quote}>« {item.quote} »</Text>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </FadeInView>
        ))}
      </View>
    </MarketingSection>
  );
}

export function PricingSection() {
  return (
    <MarketingSection id="pricing" subtitle={PRICING_CONTENT.subtitle} title={PRICING_CONTENT.title}>
      <View style={styles.pricingGrid}>
        {PRICING_CONTENT.plans.map((plan, index) => (
          <FadeInView delay={index * 100} key={plan.id} style={StyleSheet.flatten([styles.pricingCard, plan.highlighted ? styles.pricingHighlighted : undefined])}>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>{plan.period}</Text>
            </View>
            <Text style={styles.planDescription}>{plan.description}</Text>
            <View style={styles.planFeatures}>
              {plan.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <MarketingButton
              href={plan.id === 'premium' ? '/register' : '/register'}
              label={plan.cta}
              variant={plan.highlighted ? 'primary' : 'secondary'}
            />
          </FadeInView>
        ))}
      </View>
    </MarketingSection>
  );
}

export function FaqSection() {
  return (
    <MarketingSection alt id="faq" title={FAQ_CONTENT.title}>
      <View style={styles.faqList}>
        {FAQ_CONTENT.items.map((item, index) => (
          <FadeInView delay={index * 50} key={item.question} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </FadeInView>
        ))}
      </View>
    </MarketingSection>
  );
}

export function CtaSection() {
  return (
    <LinearGradient
      colors={[marketingColors.gradientStart, marketingColors.gradientEnd]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.cta}>
      <FadeInView style={styles.ctaInner}>
        <Text style={styles.ctaTitle}>{CTA_CONTENT.title}</Text>
        <Text style={styles.ctaSubtitle}>{CTA_CONTENT.subtitle}</Text>
        <MarketingButton href="/register" label={CTA_CONTENT.cta} variant="secondary" />
      </FadeInView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: marketingSpacing.xxl,
    paddingBottom: marketingSpacing.section,
    paddingHorizontal: marketingSpacing.lg,
  },
  heroInner: {
    maxWidth: marketingSpacing.container,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: marketingSpacing.xxl,
  },
  heroContent: {
    flex: 1,
    minWidth: 280,
    gap: marketingSpacing.lg,
  },
  overline: marketingText({
    ...marketingTypography.overline,
    color: marketingColors.primary,
  }),
  heroTitle: marketingText({
    ...marketingTypography.hero,
    color: marketingColors.text,
  }),
  heroTitleMobile: marketingText({
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: marketingColors.text,
  }),
  heroSubtitle: marketingText({
    ...marketingTypography.bodyLarge,
    color: marketingColors.textSecondary,
    maxWidth: 520,
  }),
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: marketingSpacing.md,
  },
  heroVisual: {
    flex: 1,
    minWidth: 280,
    alignItems: 'center',
  },
  mockDashboard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: marketingColors.surface,
    borderRadius: marketingRadius.xl,
    padding: marketingSpacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
    ...marketingShadow,
  },
  mockBar: {
    height: 12,
    width: '40%',
    backgroundColor: marketingColors.primaryLight,
    borderRadius: marketingRadius.sm,
    marginBottom: marketingSpacing.lg,
  },
  mockGrid: { gap: marketingSpacing.md },
  mockCard: {
    height: 72,
    backgroundColor: marketingColors.backgroundAlt,
    borderRadius: marketingRadius.md,
  },
  mockCardWide: {
    height: 120,
    backgroundColor: marketingColors.primaryLight,
    borderRadius: marketingRadius.md,
    opacity: 0.6,
  },
  bulletGrid: { gap: marketingSpacing.md },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: marketingSpacing.md,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: marketingColors.primary,
    marginTop: 9,
  },
  bulletText: marketingText({
    ...marketingTypography.body,
    color: marketingColors.text,
    flex: 1,
  }),
  cardGrid: {
    gap: marketingSpacing.lg,
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: marketingColors.surface,
    borderRadius: marketingRadius.lg,
    padding: marketingSpacing.lg,
    gap: marketingSpacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
    ...marketingShadow,
  },
  cardTitle: marketingText({
    ...marketingTypography.h3,
    color: marketingColors.text,
  }),
  cardDescription: marketingText({
    ...marketingTypography.body,
    color: marketingColors.textSecondary,
  }),
  mobileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: marketingSpacing.xxl,
    justifyContent: 'center',
  },
  phoneMock: {
    width: 220,
    height: 440,
    borderRadius: 32,
    backgroundColor: marketingColors.text,
    padding: 12,
    ...marketingShadow,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: marketingColors.background,
    borderRadius: 24,
    padding: marketingSpacing.md,
    gap: marketingSpacing.sm,
  },
  phoneHeader: {
    height: 24,
    backgroundColor: marketingColors.primaryLight,
    borderRadius: marketingRadius.sm,
  },
  phoneLine: {
    height: 12,
    backgroundColor: marketingColors.border,
    borderRadius: 4,
    width: '80%',
  },
  phoneLineShort: {
    height: 12,
    backgroundColor: marketingColors.border,
    borderRadius: 4,
    width: '50%',
  },
  phoneCard: {
    flex: 1,
    backgroundColor: marketingColors.surface,
    borderRadius: marketingRadius.md,
    marginTop: marketingSpacing.sm,
  },
  mobileHighlights: { gap: marketingSpacing.md, minWidth: 240 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: marketingSpacing.sm },
  highlightCheck: { color: marketingColors.success, fontWeight: '700', fontSize: 16 },
  highlightText: marketingText({ ...marketingTypography.body, color: marketingColors.text }),
  screenshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: marketingSpacing.lg,
    justifyContent: 'center',
  },
  screenshotCard: { flex: 1, minWidth: 240, maxWidth: 280 },
  screenshotPlaceholder: {
    aspectRatio: 9 / 16,
    backgroundColor: marketingColors.surface,
    borderRadius: marketingRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...marketingShadow,
  },
  screenshotLabel: marketingText({
    ...marketingTypography.caption,
    color: marketingColors.textMuted,
  }),
  testimonialCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: marketingColors.surface,
    borderRadius: marketingRadius.lg,
    padding: marketingSpacing.lg,
    gap: marketingSpacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
  },
  quote: marketingText({
    ...marketingTypography.body,
    color: marketingColors.text,
    fontStyle: 'italic',
  }),
  author: marketingText({ ...marketingTypography.caption, color: marketingColors.text, fontWeight: '600' }),
  role: marketingText({ ...marketingTypography.caption, color: marketingColors.textMuted }),
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: marketingSpacing.lg,
    justifyContent: 'center',
  },
  pricingCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 360,
    backgroundColor: marketingColors.surface,
    borderRadius: marketingRadius.xl,
    padding: marketingSpacing.xl,
    gap: marketingSpacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
    ...marketingShadow,
  },
  pricingHighlighted: {
    borderColor: marketingColors.primary,
    borderWidth: 2,
  },
  planName: marketingText({ ...marketingTypography.h3, color: marketingColors.text }),
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: marketingText({ fontSize: 40, fontWeight: '700', color: marketingColors.text }),
  period: marketingText({ ...marketingTypography.caption, color: marketingColors.textMuted }),
  planDescription: marketingText({ ...marketingTypography.body, color: marketingColors.textSecondary }),
  planFeatures: { gap: marketingSpacing.sm, marginVertical: marketingSpacing.sm },
  featureRow: { flexDirection: 'row', gap: marketingSpacing.sm, alignItems: 'center' },
  featureCheck: { color: marketingColors.success, fontWeight: '700' },
  featureText: marketingText({ ...marketingTypography.body, color: marketingColors.text }),
  faqList: { gap: marketingSpacing.md, maxWidth: 800, alignSelf: 'center', width: '100%' },
  faqItem: {
    backgroundColor: marketingColors.surface,
    borderRadius: marketingRadius.lg,
    padding: marketingSpacing.lg,
    gap: marketingSpacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
  },
  faqQuestion: marketingText({ ...marketingTypography.h3, color: marketingColors.text, fontSize: 18 }),
  faqAnswer: marketingText({ ...marketingTypography.body, color: marketingColors.textSecondary }),
  cta: {
    marginHorizontal: marketingSpacing.lg,
    marginBottom: marketingSpacing.xxl,
    borderRadius: marketingRadius.xl,
    padding: marketingSpacing.xxl,
  },
  ctaInner: {
    alignItems: 'center',
    gap: marketingSpacing.lg,
    maxWidth: 640,
    alignSelf: 'center',
  },
  ctaTitle: marketingText({
    ...marketingTypography.h2,
    color: marketingColors.textInverse,
    textAlign: 'center',
  }),
  ctaSubtitle: marketingText({
    ...marketingTypography.bodyLarge,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  }),
});
