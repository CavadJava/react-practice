export const slugify = (text: string) => {
  const azToEn: { [key: string]: string } = {
    'ə': 'e', 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ə': 'e', 'Ç': 'c', 'Ğ': 'g', 'I': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
    ' ': '-', '/': '-', '&': '-and-', ',': ''
  };

  return text
    .split('')
    .map(char => azToEn[char] || char)
    .join('')
    .toLowerCase()
    .replace(/-+/g, '-') // Ardıcıl gələn xətləri tekləşdirir
    .replace(/^-+|-+$/g, ''); // Başdakı və sondakı xətləri silir
};