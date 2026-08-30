/**
 * INVEQ color tokens — source: docs/design/DESIGN.md
 * Do not invent colors outside this file.
 */

export const colors = {
  /** Fond d'écran */
  background: '#F7F8FA',
  backgroundSecondary: '#F7F8FA',
  backgroundGrouped: '#F7F8FA',
  backgroundTertiary: '#FFFFFF',
  backgroundSelected: '#EAEFF8',
  backgroundElevated: '#FFFFFF',

  /** Surface (carte, barre) */
  surface: '#FFFFFF',
  /** Surface enfoncée / champ inerte */
  surfaceSecondary: '#F2F4F8',
  surfaceElevated: '#FFFFFF',
  backgroundElement: '#F2F4F8',

  /** Accent (lien, état actif, focus) — DESIGN §2.1 */
  primary: '#33549B',
  primaryHover: '#26407A',
  primaryPressed: '#26407A',
  primarySubtle: '#EAEFF8',
  primaryMuted: '#EAEFF8',
  onPrimary: '#FFFFFF',
  textLink: '#33549B',
  borderFocus: '#33549B',

  /**
   * Encre pour bouton primaire (fond #1B1D24).
   * Distinct de `primary` (accent bleu) — DESIGN §3.1.
   */
  ink: '#1B1D24',
  inkPressed: '#14161C',
  onInk: '#FFFFFF',

  text: '#1B1D24',
  textSecondary: '#4C505E',
  textTertiary: '#75798C',
  textQuaternary: '#9397AB',
  textPlaceholder: '#9397AB',
  textInverse: '#FFFFFF',
  textInactive: '#9397AB',

  border: '#E8EAF0',
  borderStrong: '#C9CEDB',
  borderControl: '#C9CEDB',
  separator: '#EEF0F5',
  separatorOpaque: '#E8EAF0',
  /** Piste segmented — DESIGN §3.5 */
  segmentedTrack: '#ECEEF4',

  icon: '#1B1D24',
  iconSecondary: '#4C505E',
  iconTertiary: '#75798C',
  iconInverse: '#FFFFFF',

  /** Statuts — DESIGN §2.3 */
  statusPaid: '#1C6B4A',
  statusPaidBg: '#E7F2EC',
  statusSent: '#33549B',
  statusSentBg: '#EAEFF8',
  statusPending: '#8A6320',
  statusPendingBg: '#F8F1E2',
  statusOverdue: '#9A3B2C',
  statusOverdueBg: '#FBEAE6',
  statusDraft: '#61656F',
  statusDraftBg: '#EFF1F5',
  /** Neutre — document annulé / refusé (mêmes valeurs que brouillon, ton nommé à part) */
  statusCanceled: '#61656F',
  statusCanceledBg: '#EFF1F5',

  success: '#1C6B4A',
  successSubtle: '#E7F2EC',
  onSuccess: '#FFFFFF',

  warning: '#8A6320',
  warningSubtle: '#F8F1E2',
  onWarning: '#FFFFFF',

  error: '#9A3B2C',
  errorSubtle: '#FBEAE6',
  onError: '#FFFFFF',

  info: '#33549B',
  infoSubtle: '#EAEFF8',
  onInfo: '#FFFFFF',

  /** Overlay bottom sheet — DESIGN §3.6 */
  overlay: 'rgba(27, 29, 36, 0.42)',
  scrim: 'rgba(27, 29, 36, 0.42)',

  tabBar: 'rgba(255, 255, 255, 0.94)',
  tabBarBorder: '#E8EAF0',

  /** Destructif (bordure bouton) */
  destructiveBorder: '#E7CFC9',
} as const;

/** Mode sombre — DESIGN §2.2. Pas une inversion. */
export const colorsDark = {
  background: '#14161C',
  backgroundSecondary: '#14161C',
  backgroundGrouped: '#14161C',
  backgroundTertiary: '#1B1E26',
  backgroundSelected: 'rgba(127, 161, 232, 0.16)',
  backgroundElevated: '#1B1E26',

  surface: '#1B1E26',
  surfaceSecondary: '#21242E',
  surfaceElevated: '#1B1E26',
  backgroundElement: '#21242E',

  primary: '#7FA1E8',
  primaryHover: '#7FA1E8',
  primaryPressed: '#7FA1E8',
  primarySubtle: 'rgba(127, 161, 232, 0.16)',
  primaryMuted: 'rgba(127, 161, 232, 0.16)',
  onPrimary: '#14161C',
  textLink: '#7FA1E8',
  borderFocus: '#7FA1E8',

  /** Action primaire sombre = surface claire — DESIGN §2.2 */
  ink: '#E9EBF0',
  inkPressed: '#FFFFFF',
  onInk: '#14161C',

  text: '#E9EBF0',
  textSecondary: '#C3C9D6',
  textTertiary: '#9AA0B0',
  textQuaternary: '#6E7482',
  textPlaceholder: '#6E7482',
  textInverse: '#14161C',
  textInactive: '#6E7482',

  border: '#2B2F3A',
  borderStrong: '#3A3F4C',
  borderControl: '#3A3F4C',
  separator: '#262A34',
  separatorOpaque: '#2B2F3A',
  /** Piste segmented sombre — surface enfoncée distincte */
  segmentedTrack: '#21242E',

  icon: '#E9EBF0',
  iconSecondary: '#C3C9D6',
  iconTertiary: '#9AA0B0',
  iconInverse: '#14161C',

  statusPaid: '#7FD2A4',
  statusPaidBg: 'rgba(127, 210, 164, 0.15)',
  statusSent: '#7FA1E8',
  statusSentBg: 'rgba(127, 161, 232, 0.16)',
  statusPending: '#D8B26A',
  statusPendingBg: 'rgba(216, 178, 106, 0.15)',
  statusOverdue: '#E8907F',
  statusOverdueBg: 'rgba(232, 144, 127, 0.15)',
  statusDraft: '#9AA0B0',
  statusDraftBg: '#262A34',
  statusCanceled: '#9AA0B0',
  statusCanceledBg: '#262A34',

  success: '#7FD2A4',
  successSubtle: 'rgba(127, 210, 164, 0.15)',
  onSuccess: '#14161C',

  warning: '#D8B26A',
  warningSubtle: 'rgba(216, 178, 106, 0.15)',
  onWarning: '#14161C',

  error: '#E8907F',
  errorSubtle: 'rgba(232, 144, 127, 0.15)',
  onError: '#14161C',

  info: '#7FA1E8',
  infoSubtle: 'rgba(127, 161, 232, 0.16)',
  onInfo: '#14161C',

  overlay: 'rgba(0, 0, 0, 0.55)',
  scrim: 'rgba(0, 0, 0, 0.55)',

  tabBar: 'rgba(27, 30, 38, 0.94)',
  tabBarBorder: '#2B2F3A',

  destructiveBorder: '#5A3A34',
} as const;

export type ColorToken = keyof typeof colors;

