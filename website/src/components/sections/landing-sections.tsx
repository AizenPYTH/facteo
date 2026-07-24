'use client';

import React from 'react';
import InvoiceHero from '@/components/hero/InvoiceHero';
import { FadeIn } from '@/components/ui/fade-in';
import { FEATURES } from '@/lib/content';
import { APP_REGISTER_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';

// Note: This file is a trimmed modification of the original landing-sections.tsx

export function HeroSection() {
  return (
    <div>
      <InvoiceHero />
    </div>
  );
}
