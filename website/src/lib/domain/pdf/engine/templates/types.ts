export type PdfLayoutVariant =
  | 'classic'
  | 'banner'
  | 'sidebar'
  | 'minimal'
  | 'stripe'
  | 'centered'
  | 'split'
  | 'card';

export type PdfLogoPosition = 'left' | 'center' | 'right';
export type PdfHeaderStyle = 'default' | 'band' | 'underline' | 'boxed';
export type PdfTableStyle = 'default' | 'striped' | 'bordered' | 'minimal';
export type PdfTotalsStyle = 'default' | 'highlight' | 'boxed' | 'accent';

export type PdfTemplateTheme = {
  primary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  surface: string;
  surfaceAlt: string;
  paymentBg: string;
  paymentBorder: string;
};

export type PdfTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  inspiration: string;
  theme: PdfTemplateTheme;
  layout: PdfLayoutVariant;
  logoPosition: PdfLogoPosition;
  headerStyle: PdfHeaderStyle;
  tableStyle: PdfTableStyle;
  totalsStyle: PdfTotalsStyle;
  showPartyCards: boolean;
  titleAlign: 'left' | 'right' | 'center';
  fontFamily: string;
};

export const DEFAULT_PDF_TEMPLATE_ID = 'classic-blue';
