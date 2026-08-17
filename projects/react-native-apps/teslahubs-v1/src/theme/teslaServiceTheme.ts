// Fixed brand palette for the Tesla Servis section — intentionally independent
// of the app's ThemeContext, same reasoning as AvtoYuma's CW_THEME. Black +
// Tesla red so it reads as its own dedicated service app.
export const TS_THEME = {
  bg: '#0B0B0C',
  card: '#1A1A1C',
  cardAlt: '#232325',
  primary: '#E31937',
  primaryDark: '#B01329',
  text: '#F5F5F5',
  textMuted: '#9A9A9E',
  border: '#2C2C2F',
  white: '#FFFFFF',
} as const;
