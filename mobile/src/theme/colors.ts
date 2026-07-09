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
  navy: '#000e32', // primary
  navyDark: '#00081f',
  navyContainer: '#00215e', // primary-container
  onNavyContainer: '#748bcd', // on-primary-container
  navySoft: '#dae1ff', // primary-fixed (soft navy fill)

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
  teacher: '#000e32',
  teacherSoft: '#dae1ff',
  student: '#0059bb',
  studentSoft: '#d8e2ff',
} as const;

export type ColorName = keyof typeof colors;

/** Role-aware accent helper. Teacher = navy, Student = azure. */
export function roleAccent(role?: string | null) {
  const teacher = role === 'teacher';
  return {
    accent: teacher ? colors.teacher : colors.student,
    accentSoft: teacher ? colors.teacherSoft : colors.studentSoft,
    accentContainer: teacher ? colors.navyContainer : colors.blueLight,
  };
}
