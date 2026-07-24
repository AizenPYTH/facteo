import { useEffect } from 'react';
import { Platform } from 'react-native';

import { MARKETING_SEO, MARKETING_SITE_URL } from '@/constants/marketing/site';

type MarketingSeoProps = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const selector = `meta[${attribute}="${key}"]`;
  let element = document.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

export function MarketingSeo({
  title = MARKETING_SEO.defaultTitle,
  description = MARKETING_SEO.defaultDescription,
  path = '/',
  noIndex = false,
}: MarketingSeoProps) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const url = `${MARKETING_SITE_URL}${path}`;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', 'INVEQ');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:locale', MARKETING_SEO.locale);
    upsertMeta('property', 'og:image', MARKETING_SEO.ogImage);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', MARKETING_SEO.ogImage);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = url;
  }, [description, noIndex, path, title]);

  return null;
}
