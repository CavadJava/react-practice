export enum ConnectorType {
  Tesla = 'tesla',
  CCS2 = 'ccs2',
  Type2 = 'type2',
  CHAdeMO = 'chademo',
}

export type ChargingStation = {
  id: string;
  name: string;
  network: string;
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
    name: 'Tesla Supercharger — 28 Mall',
    network: 'Tesla Supercharger',
    address: '28 Mall, Nizami küç., Bakı',
    lat: 40.3777,
    lng: 49.8462,
    connectors: [ConnectorType.Tesla],
    fastCharging: true,
    portsTotal: 8,
    portsAvailable: 5,
    pricePerKwh: 0.35,
    is24h: true,
  },
  {
    id: 'cs2',
    name: 'SOCAR EV — Xətai',
    network: 'SOCAR',
    address: 'Xətai rayonu, Bakı',
    lat: 40.3959,
    lng: 49.8878,
    connectors: [ConnectorType.CCS2, ConnectorType.Type2],
    fastCharging: true,
    portsTotal: 4,
    portsAvailable: 2,
    pricePerKwh: 0.3,
    is24h: true,
  },
  {
    id: 'cs3',
    name: 'AzEnerji Charge — Yasamal',
    network: 'AzEnerji',
    address: 'Yasamal rayonu, Bakı',
    lat: 40.3853,
    lng: 49.8215,
    connectors: [ConnectorType.Type2],
    fastCharging: false,
    portsTotal: 2,
    portsAvailable: 0,
    pricePerKwh: 0.22,
    is24h: false,
  },
  {
    id: 'cs4',
    name: 'Port Baku Charging Hub',
    network: 'BP Pulse',
    address: 'Neftçilər prospekti, Bakı',
    lat: 40.3706,
    lng: 49.8523,
    connectors: [ConnectorType.CCS2, ConnectorType.CHAdeMO, ConnectorType.Type2],
    fastCharging: true,
    portsTotal: 6,
    portsAvailable: 6,
    pricePerKwh: 0.32,
    is24h: true,
  },
  {
    id: 'cs5',
    name: 'Gənclik Mall EV Point',
    network: 'EV Baku',
    address: 'Gənclik metrosu yaxınlığı, Bakı',
    lat: 40.4009,
    lng: 49.8483,
    connectors: [ConnectorType.Type2, ConnectorType.CCS2],
    fastCharging: false,
    portsTotal: 3,
    portsAvailable: 1,
    pricePerKwh: 0.28,
    is24h: false,
  },
];

export function getStationsByConnector(type: ConnectorType | null): ChargingStation[] {
  return type ? CHARGING_STATIONS.filter(s => s.connectors.includes(type)) : CHARGING_STATIONS;
}
