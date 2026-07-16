import { useEffect } from 'react';
import { Platform } from 'react-native';

import { MarketingShell } from '@/components/marketing/marketing-shell';
import { MarketingSeo } from '@/components/marketing/marketing-seo';
import {
  CtaSection,
  FaqSection,
  FeaturesSection,
  HeroSection,
  MobileSection,
  PresentationSection,
  PricingSection,
  ScreenshotsSection,
  TestimonialsSection,
  WhySection,
} from '@/components/marketing/landing-sections';
import { MARKETING_SEO } from '@/constants/marketing/site';

export function LandingPage() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location.hash) {
      return;
    }

    const id = window.location.hash.replace('#', '');
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <MarketingSeo
        description={MARKETING_SEO.defaultDescription}
        path="/"
        title={MARKETING_SEO.defaultTitle}
      />
      <MarketingShell>
        <HeroSection />
        <PresentationSection />
        <WhySection />
        <FeaturesSection />
        <MobileSection />
        <ScreenshotsSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </MarketingShell>
    </>
  );
}
