export type CarWashBranch = {
  id: string;
  address: string;
  phone?: string;
  workingHours?: string;
};

export type CarWashProvider = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  branches: CarWashBranch[];
};

export const CAR_WASH_PROVIDERS: CarWashProvider[] = [
  {
    id: 'cw50',
    name: '50 Yuma Mərkəzi',
    tagline: '50 fərqli xidmət növü',
    color: '#0F6FB8',
    branches: [
      { id: 'b1', address: 'Nizami küç. 118, Bakı', phone: '+994 12 555 50 50', workingHours: '08:00–22:00' },
      { id: 'b2', address: 'Xətai rayonu, Zərifə Əliyeva küç. 12, Bakı', phone: '+994 12 555 50 51', workingHours: '08:00–22:00' },
    ],
  },
  {
    id: 'cwpremium',
    name: 'Premium Xidmət',
    tagline: 'VIP avtomobil qulluğu',
    color: '#0EA5A5',
    branches: [{ id: 'b1', address: 'Yasamal rayonu, Ə. Naxçıvani küç. 5, Bakı', phone: '+994 12 555 20 20', workingHours: '09:00–21:00' }],
  },
  {
    id: 'cwavtobaku',
    name: 'AvtoBaku Xidmətləri',
    tagline: 'Sürətli və keyfiyyətli yuma',
    color: '#E08A2E',
    branches: [
      { id: 'b1', address: 'Nərimanov rayonu, Həsən Əliyev küç. 22, Bakı', phone: '+994 12 555 30 30', workingHours: '08:00–23:00' },
      { id: 'b2', address: 'Binəqədi rayonu, Bakıxanov qəs., Bakı', phone: '+994 12 555 30 31', workingHours: '08:00–23:00' },
    ],
  },
];

export function getCarWashProvider(id: string): CarWashProvider | undefined {
  return CAR_WASH_PROVIDERS.find(p => p.id === id);
}

export type VehicleType = 'sedan' | 'suv' | 'offroad';

// The base wash service is paid, priced by vehicle size — same pricing across
// every provider/branch for now.
export const VEHICLE_TYPES: { key: VehicleType; label: string; price: number }[] = [
  { key: 'sedan', label: 'Sedan', price: 15 },
  { key: 'suv', label: 'Cip (SUV)', price: 25 },
  { key: 'offroad', label: 'Offroad', price: 50 },
];

// Bundled perks included free with any paid wash — informational only, not selectable.
export const FREE_SERVICES: string[] = ['Xarici yuma', 'Şüşələrin təmizlənməsi', 'Təkərlərin təmizlənməsi', 'Ətirləmə'];

export type AddonService = { id: string; name: string; price: number };

// Optional extras offered while the car is being washed, each priced separately.
export const ADDON_SERVICES: AddonService[] = [
  { id: 'interior', name: 'Salonun tozsorana ilə təmizlənməsi', price: 10 },
  { id: 'seats', name: 'Oturacaqların kimyəvi təmizlənməsi', price: 25 },
  { id: 'polish', name: 'Parlaqlaşdırma (Polish)', price: 20 },
  { id: 'wax', name: 'Vaks örtüyü', price: 18 },
  { id: 'engine', name: 'Mühərrik hissəsinin yuyulması', price: 15 },
  { id: 'tire', name: 'Təkər parlaqlığı (Tire Shine)', price: 8 },
];

export const TIME_SLOTS: string[] = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
