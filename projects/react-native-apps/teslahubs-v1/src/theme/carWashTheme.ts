// Fixed brand palette for the AvtoYuma section — intentionally independent of
// the app's ThemeContext (classic/midnight/ember/white) so this section keeps
// a consistent look regardless of the user's chosen Teslahubs theme.
export const CW_THEME = {
  bg: '#F4F9FC',
  card: '#FFFFFF',
  primary: '#0F6FB8',
  primaryDark: '#0B5590',
  text: '#0B2436',
  textMuted: '#5B7285',
  border: '#DCEAF3',
  white: '#FFFFFF',
} as const;
