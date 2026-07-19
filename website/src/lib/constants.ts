/**
 * Sans domaine custom : mets ton URL Vercel dans NEXT_PUBLIC_SITE_URL
 * ex. https://ton-projet.vercel.app
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://factume.vercel.app';

export const APP_URL = SITE_URL;
export const APP_DASHBOARD_URL = '/app';
export const APP_LOGIN_URL = '/login';
export const APP_REGISTER_URL = '/register';

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'farouqdib@gmail.com';
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'farouqdib@gmail.com';

export const SITE_NAME = 'Factume';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
