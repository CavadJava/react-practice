// Fixed brand palette for the Kargo (cargo companies) section —
// intentionally independent of the app's ThemeContext, same reasoning as
// AvtoYuma's CW_THEME. Slate/steel blue so it reads as its own utility
// mini-app.
export const CG_THEME = {
  bg: '#0B1420',
  card: '#141F2E',
  cardAlt: '#1B2A3D',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  text: '#EDF3FA',
  textMuted: '#87A0BC',
  border: '#22344A',
  white: '#FFFFFF',
  success: '#22C55E',
  danger: '#F87171',
} as const;
