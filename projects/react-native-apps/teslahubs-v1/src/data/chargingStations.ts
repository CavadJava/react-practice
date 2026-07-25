export enum ConnectorType {
  NACS = 'nacs',
  GBT = 'gbt',
  CHAdeMO = 'chademo',
  CCS2 = 'ccs2',
}

export type CurrentType = 'ac' | 'dc';

export const CHARGING_NETWORKS = ['Azərişıq', 'Tok.az'] as const;
export type ChargingNetwork = (typeof CHARGING_NETWORKS)[number];

export type PowerRange = { key: string; label: string; min: number; max: number };

export const POWER_RANGES: PowerRange[] = [
  { key: 'low', label: '≤22 kW', min: 0, max: 22 },
  { key: 'mid', label: '23–60 kW', min: 23, max: 60 },
  { key: 'high', label: '61–150 kW', min: 61, max: 150 },
  { key: 'ultra', label: '150+ kW', min: 151, max: Infinity },
];

export type ChargingStation = {
  id: string;
  name: string;
  network: ChargingNetwork;
  address: string;
  lat: number;
  lng: number;
  connectors: ConnectorType[];
  currentType: CurrentType;
  powerKw: number;
  portsTotal: number;
  portsAvailable: number;
  pricePerKwh: number;
  is24h: boolean;
};

export const CHARGING_STATIONS: ChargingStation[] = [
  {
    id: 'cs1',
    name: 'Azərişıq Charge — 28 Mall',
    network: 'Azərişıq',
    address: '28 Mall, Nizami küç., Bakı',
    lat: 40.3777,
    lng: 49.8462,
    connectors: [ConnectorType.NACS, ConnectorType.CCS2],
    currentType: 'dc',
    powerKw: 180,
    portsTotal: 8,
    portsAvailable: 5,
    pricePerKwh: 0.35,
    is24h: true,
  },
  {
    id: 'cs2',
    name: 'Tok.az — Xətai',
    network: 'Tok.az',
    address: 'Xətai rayonu, Bakı',
    lat: 40.3959,
    lng: 49.8878,
    connectors: [ConnectorType.CCS2, ConnectorType.GBT],
    currentType: 'dc',
    powerKw: 50,
    portsTotal: 4,
    portsAvailable: 2,
    pricePerKwh: 0.3,
    is24h: true,
  },
  {
    id: 'cs3',
    name: 'Azərişıq Charge — Yasamal',
    network: 'Azərişıq',
    address: 'Yasamal rayonu, Bakı',
    lat: 40.3853,
    lng: 49.8215,
    connectors: [ConnectorType.GBT],
    currentType: 'ac',
    powerKw: 22,
    portsTotal: 2,
    portsAvailable: 0,
    pricePerKwh: 0.22,
    is24h: false,
  },
  {
    id: 'cs4',
    name: 'Tok.az — Port Baku',
    network: 'Tok.az',
    address: 'Neftçilər prospekti, Bakı',
    lat: 40.3706,
    lng: 49.8523,
    connectors: [ConnectorType.CCS2, ConnectorType.CHAdeMO, ConnectorType.GBT],
    currentType: 'dc',
    powerKw: 180,
    portsTotal: 6,
    portsAvailable: 6,
    pricePerKwh: 0.32,
    is24h: true,
  },
  {
    id: 'cs5',
    name: 'Azərişıq Charge — Gənclik',
    network: 'Azərişıq',
    address: 'Gənclik metrosu yaxınlığı, Bakı',
    lat: 40.4009,
    lng: 49.8483,
    connectors: [ConnectorType.CCS2, ConnectorType.GBT],
    currentType: 'ac',
    powerKw: 11,
    portsTotal: 3,
    portsAvailable: 1,
    pricePerKwh: 0.28,
    is24h: false,
  },
];

export type StationFilters = {
  network: ChargingNetwork | null;
  connector: ConnectorType | null;
  currentType: CurrentType | null;
  powerRangeKey: string | null;
};

export function getChargingStation(id: string): ChargingStation | undefined {
  return CHARGING_STATIONS.find(s => s.id === id);
}

export function filterStations(filters: StationFilters): ChargingStation[] {
  const range = filters.powerRangeKey ? POWER_RANGES.find(r => r.key === filters.powerRangeKey) : undefined;
  return CHARGING_STATIONS.filter(s => {
    if (filters.network && s.network !== filters.network) return false;
    if (filters.connector && !s.connectors.includes(filters.connector)) return false;
    if (filters.currentType && s.currentType !== filters.currentType) return false;
    if (range && (s.powerKw < range.min || s.powerKw > range.max)) return false;
    return true;
  });
}
