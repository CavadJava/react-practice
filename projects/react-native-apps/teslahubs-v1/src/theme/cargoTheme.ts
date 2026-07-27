// Fixed brand palette for the Kargo (cargo companies) section —
// intentionally independent of the app's ThemeContext, same reasoning as
// AvtoYuma's CW_THEME. Warmed slightly from the original steel-blue set and
// softened (lighter primary, gentler success/danger) for better contrast
// and a friendlier feel than the original near-black/neon combination.
export const CG_THEME = {
  bg: '#0F1B2D',
  card: '#17253A',
  cardAlt: '#1E3350',
  primary: '#4F9DFF',
  primaryDark: '#3B82F6',
  text: '#F5F8FC',
  textMuted: '#9FB4CC',
  border: '#2A3F5A',
  white: '#FFFFFF',
  success: '#34D399',
  danger: '#FB7185',
} as const;
