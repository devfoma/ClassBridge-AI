/**
 * ClassBridge palette. Teacher mode leans on the deep navy brand colour,
 * student mode leans on the bright blue accent, so the two roles look clearly
 * different (per the UI quality bar).
 */
export const colors = {
  navy: '#0B2A5B',
  navyDark: '#071E42',
  blue: '#2563EB',
  blueLight: '#3B82F6',
  blueSoft: '#DBEAFE',

  bg: '#F5F7FB',
  card: '#FFFFFF',
  border: '#E3E8F0',

  text: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#0EA5E9',
  infoSoft: '#E0F2FE',

  // Role accents
  teacher: '#0B2A5B',
  teacherSoft: '#E7EDF7',
  student: '#2563EB',
  studentSoft: '#DBEAFE',
} as const;

export type ColorName = keyof typeof colors;
