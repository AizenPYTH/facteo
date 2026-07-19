import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { MARKETING_SEO, MARKETING_SITE_URL } from '@/constants/marketing/site';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, shrink-to-fit=no" name="viewport" />
        <title>{MARKETING_SEO.defaultTitle}</title>
        <meta content={MARKETING_SEO.defaultDescription} name="description" />
        <meta content="index, follow" name="robots" />
        <link href={`${MARKETING_SITE_URL}/`} rel="canonical" />

        <meta content="website" property="og:type" />
        <meta content="Factume" property="og:site_name" />
        <meta content={MARKETING_SEO.defaultTitle} property="og:title" />
        <meta content={MARKETING_SEO.defaultDescription} property="og:description" />
        <meta content={`${MARKETING_SITE_URL}/`} property="og:url" />
        <meta content={MARKETING_SEO.locale} property="og:locale" />
        <meta content={MARKETING_SEO.ogImage} property="og:image" />

        <meta content="summary_large_image" name="twitter:card" />
        <meta content={MARKETING_SEO.defaultTitle} name="twitter:title" />
        <meta content={MARKETING_SEO.defaultDescription} name="twitter:description" />
        <meta content={MARKETING_SEO.ogImage} name="twitter:image" />

        <meta content="#2563EB" name="theme-color" />
        <link href="/sitemap.xml" rel="sitemap" type="application/xml" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
