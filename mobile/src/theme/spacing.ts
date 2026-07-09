/**
 * 8px base spacing rhythm. Screen margin is fixed at 20px (design "margin-mobile")
 * to frame content away from the hardware edges.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 20, // margin-mobile
  gutter: 16,
} as const;

export const radius = {
  sm: 8, // tags, inputs
  md: 12,
  lg: 16, // cards, modals
  xl: 20,
  card: 24, // hero/bento cards ("rounded-card")
  pill: 999,
} as const;

/**
 * Depth is intentionally light — tonal layers + low-contrast outlines, with a
 * soft ambient shadow only on elevated cards and primary actions.
 */
export const shadow = {
  card: {
    shadowColor: '#000e32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  button: {
    shadowColor: '#000e32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  bar: {
    shadowColor: '#000e32',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
