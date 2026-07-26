// Fixed brand palette for the Kurslar (Learning) section — intentionally
// independent of the app's ThemeContext, same reasoning as AvtoYuma's
// CW_THEME. Deep indigo/violet so it reads as its own learning-platform
// mini-app.
export const CO_THEME = {
  bg: '#0E0B1A',
  card: '#1B1630',
  cardAlt: '#241D3D',
  primary: '#8B5CF6',
  primaryDark: '#6D3FD1',
  text: '#F3F1FA',
  textMuted: '#9C93B8',
  border: '#2E2650',
  white: '#FFFFFF',
  success: '#22C55E',
  lock: '#5B5478',
} as const;
