/** A4 dimensions at 72 PPI (points), used by expo-print. */
export const A4_WIDTH_PT = 595;
export const A4_HEIGHT_PT = 842;

function mmToPt(mm: number): number {
  return Math.round((mm * 72) / 25.4);
}

export const A4_PAGE_MARGINS_PT = {
  top: mmToPt(16),
  right: mmToPt(14),
  bottom: mmToPt(20),
  left: mmToPt(14),
} as const;

export const A4_PRINT_OPTIONS = {
  width: A4_WIDTH_PT,
  height: A4_HEIGHT_PT,
  margins: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
} as const;
