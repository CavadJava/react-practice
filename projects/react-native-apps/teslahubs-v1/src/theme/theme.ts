export type ThemeColors = {
  bg: string;
  card: string;
  cardAlt: string;
  surface: string;
  border: string;
  borderLight: string;
  divider: string;
  dividerStrong: string;
  brand: string;
  brandMuted: string;
  brandLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaded: string;
  textStrike: string;
  white: string;
};

export type ThemeKey = 'classic' | 'midnight' | 'ember' | 'white';

export const THEMES: Record<ThemeKey, { name: string; swatch: string; statusBarStyle: 'light-content' | 'dark-content'; colors: ThemeColors }> = {
  classic: {
    name: 'Klassik Qırmızı',
    swatch: '#D6402A',
    statusBarStyle: 'light-content',
    colors: {
      bg: '#1C1414',
      card: '#2A1F1F',
      cardAlt: '#332626',
      surface: '#392B2B',
      border: '#4A3636',
      borderLight: '#503A3A',
      divider: '#3F2F2F',
      dividerStrong: '#453232',
      brand: '#D6402A',
      brandMuted: '#A8331F',
      brandLight: '#E2795F',
      text: '#F5F2EF',
      textSecondary: '#DAD4CF',
      textMuted: '#C7BFB9',
      textFaded: '#9C9187',
      textStrike: '#8C8177',
      white: '#FFFFFF',
    },
  },
  midnight: {
    name: 'Gecə Mavisi',
    swatch: '#2F8FE0',
    statusBarStyle: 'light-content',
    colors: {
      bg: '#12161C',
      card: '#1C222B',
      cardAlt: '#232A35',
      surface: '#28303C',
      border: '#34404E',
      borderLight: '#3B4856',
      divider: '#2C3743',
      dividerStrong: '#313D4A',
      brand: '#2F8FE0',
      brandMuted: '#24629B',
      brandLight: '#6BB6FF',
      text: '#F2F5F8',
      textSecondary: '#D7E0E8',
      textMuted: '#C2CDD6',
      textFaded: '#8FA0AD',
      textStrike: '#7C8D9A',
      white: '#FFFFFF',
    },
  },
  ember: {
    name: 'Alov Narıncı',
    swatch: '#E08A2E',
    statusBarStyle: 'light-content',
    colors: {
      bg: '#17140F',
      card: '#241E16',
      cardAlt: '#2C251B',
      surface: '#322A1F',
      border: '#423628',
      borderLight: '#4A3D2C',
      divider: '#362C20',
      dividerStrong: '#3C3123',
      brand: '#E08A2E',
      brandMuted: '#B06A1E',
      brandLight: '#F2B366',
      text: '#F7F1E8',
      textSecondary: '#E4D9C9',
      textMuted: '#D1C3AE',
      textFaded: '#A6957C',
      textStrike: '#93816A',
      white: '#FFFFFF',
    },
  },
  white: {
    name: 'Ağ',
    swatch: '#FFFFFF',
    statusBarStyle: 'dark-content',
    colors: {
      bg: '#F7F5F2',
      card: '#FFFFFF',
      cardAlt: '#F0ECE7',
      surface: '#EAE4DD',
      border: '#E1D9CE',
      borderLight: '#EAE2D6',
      divider: '#E5DDD1',
      dividerStrong: '#D9CFC0',
      brand: '#D6402A',
      brandMuted: '#B5301F',
      brandLight: '#B23923',
      text: '#221815',
      textSecondary: '#40322E',
      textMuted: '#5C4C46',
      textFaded: '#8A7A73',
      textStrike: '#A6968E',
      white: '#FFFFFF',
    },
  },
};

export const DEFAULT_THEME: ThemeKey = 'classic';

export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
} as const;
