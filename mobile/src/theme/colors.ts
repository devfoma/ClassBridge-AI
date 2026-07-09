/**
 * ClassBridge AI palette — derived from the design system in
 * assets/Design/DESIGN.md. Deep navy (#000e32) is the structural/brand colour
 * (Teacher mode); vibrant azure (#0059bb) is the interactive colour (Student
 * mode). Surfaces are tonal off-whites; borders are low-contrast outlines.
 *
 * Legacy key names (navy, blue, bg, card, border, text, textMuted…) are kept so
 * existing screens keep compiling, but their values now map to the design tokens.
 */
export const colors = {
  // ── Brand / role ────────────────────────────────────────────────
  // Made blue theme consistent throughout by pointing navy to blue
  navy: '#0059bb', // primary
  navyDark: '#004088',
  navyContainer: '#0070ea', // primary-container
  onNavyContainer: '#ffffff', // on-primary-container
  navySoft: '#d8e2ff', // primary-fixed (soft navy fill)

  blue: '#0059bb', // secondary (azure)
  blueLight: '#0070ea', // secondary-container
  blueSoft: '#d8e2ff', // secondary-fixed (soft azure fill)

  // ── Surfaces ────────────────────────────────────────────────────
  bg: '#f9f9fc', // background / surface
  card: '#ffffff', // surface-container-lowest
  surface1: '#f3f3f6', // surface-container-low
  surface2: '#eeeef0', // surface-container
  surface3: '#e8e8ea', // surface-container-high
  border: '#e5e6ee', // subtle 1px card border
  outline: '#757681',
  outlineVariant: '#c5c6d1',

  // ── Text ────────────────────────────────────────────────────────
  text: '#1a1c1e', // on-surface
  textMuted: '#444650', // on-surface-variant
  textFaint: '#757681', // outline (low-emphasis meta)
  textInverse: '#ffffff',

  // ── Status ──────────────────────────────────────────────────────
  success: '#0f8a4c',
  successSoft: '#d6f2e0',
  warning: '#9a5b00',
  warningSoft: '#ffdbc2', // tertiary-fixed family
  danger: '#ba1a1a', // error
  dangerSoft: '#ffdad6', // error-container
  dangerText: '#93000a', // on-error-container
  info: '#0059bb',
  infoSoft: '#d8e2ff',

  // ── Role accents ────────────────────────────────────────────────
  teacher: '#0059bb',
  teacherSoft: '#d8e2ff',
  student: '#0059bb',
  studentSoft: '#d8e2ff',
} as const;

export type ColorName = keyof typeof colors;

export function roleAccent(role?: string | null) {
  // Use blue theme consistently throughout the app regardless of role
  return {
    accent: colors.student,
    accentSoft: colors.studentSoft,
    accentContainer: colors.blueLight,
  };
}
