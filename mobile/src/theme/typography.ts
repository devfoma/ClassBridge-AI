import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * The design system uses Inter exclusively. These are the static Inter families
 * from @expo-google-fonts/inter, loaded in app/_layout.tsx.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Map a CSS-style font weight to the matching Inter family. */
export function fontForWeight(weight?: TextStyle['fontWeight']): string {
  switch (String(weight)) {
    case '900':
    case '800':
      return fonts.extrabold;
    case '700':
    case 'bold':
      return fonts.bold;
    case '600':
      return fonts.semibold;
    case '500':
      return fonts.medium;
    default:
      return fonts.regular;
  }
}

/**
 * Design type scale (assets/Design/DESIGN.md). Slightly larger than typical mobile
 * apps for classroom legibility; generous line heights for reading comfort.
 */
export const text: Record<string, TextStyle> = {
  headlineLg: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.navy,
  },
  headlineLgMobile: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: colors.navy,
  },
  headlineMd: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.navy,
  },
  titleLg: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  bodyLg: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 28,
    color: colors.text,
  },
  bodyMd: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  bodySm: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  labelMd: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    color: colors.text,
  },
  labelSm: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
};

/** Legacy aliases kept for any screens not yet migrated. */
export const typography: Record<string, TextStyle> = {
  h1: text.headlineLgMobile,
  h2: text.headlineMd,
  h3: text.titleLg,
  title: text.title,
  body: text.bodyMd,
  label: text.labelMd,
  small: text.labelSm,
};
