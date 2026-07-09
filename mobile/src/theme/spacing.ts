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
    shadowColor: '#00215e', // deep blue shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  button: {
    shadowColor: '#00215e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  bar: {
    shadowColor: '#00215e',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
