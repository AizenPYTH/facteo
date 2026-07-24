/**
 * Production : https://inveq.fr
 * Override local : NEXT_PUBLIC_SITE_URL=http://localhost:3000
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://inveq.fr';

export const APP_URL = SITE_URL;
export const APP_DASHBOARD_URL = '/app';
export const APP_LOGIN_URL = '/login';
export const APP_REGISTER_URL = '/register';

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'farouqdib@gmail.com';
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'farouqdib@gmail.com';

export const SITE_NAME = 'INVEQ';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;
