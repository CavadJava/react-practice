import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: {
    ad: 'İlham',
    soyad: 'Həsənov',
    email: 'i.hasanov@emas.gov.az',
    telefon: '+994 50 777 88 99',
    sobe: 'İnformasiya Texnologiyaları',
    vezife: 'Baş Administrator',
    rol: 'Admin',
    about: 'EMAS sisteminin baş administratoru. İT altyapısı və sistem təhlükəsizliyi üzrə məsuldur.',
    qosulma: '15 Mart 2021',
    sonGiris: '11.07.2026 09:14',
    twofa: true,
  },

  updateProfile: (data) =>
    set(s => ({ user: { ...s.user, ...data } })),

  toggle2fa: () =>
    set(s => ({ user: { ...s.user, twofa: !s.user.twofa } })),
}))
