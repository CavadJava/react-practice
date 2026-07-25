export enum ConnectorType {
  NACS = 'nacs',
  CCS2 = 'ccs2',
  GBT = 'gbt',
}

// Every station in the network offers all three connector standards.
const ALL_CONNECTORS: ConnectorType[] = [ConnectorType.CCS2, ConnectorType.GBT, ConnectorType.NACS];

export const CHARGING_NETWORKS = ['Azərişıq', 'Tok.az'] as const;
export type ChargingNetwork = (typeof CHARGING_NETWORKS)[number];

export type ChargingStation = {
  id: string;
  name: string;
  network: ChargingNetwork;
  address: string;
  lat: number;
  lng: number;
  connectors: ConnectorType[];
  fastCharging: boolean;
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
    connectors: ALL_CONNECTORS,
    fastCharging: true,
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
    connectors: ALL_CONNECTORS,
    fastCharging: true,
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
    connectors: ALL_CONNECTORS,
    fastCharging: false,
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
    connectors: ALL_CONNECTORS,
    fastCharging: true,
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
    connectors: ALL_CONNECTORS,
    fastCharging: false,
    portsTotal: 3,
    portsAvailable: 1,
    pricePerKwh: 0.28,
    is24h: false,
  },
];

export function getStationsByNetwork(network: ChargingNetwork | null): ChargingStation[] {
  return network ? CHARGING_STATIONS.filter(s => s.network === network) : CHARGING_STATIONS;
}
