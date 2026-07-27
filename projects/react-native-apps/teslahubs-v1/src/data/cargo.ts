export type CargoCompany = {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
};

// More cargo companies can be added here later — everything else (accounts,
// CRUD, sessions/tabs) is generic and keyed off companyId, not hardcoded to
// a specific company.
export const CARGO_COMPANIES: CargoCompany[] = [
  { id: '166karqo', name: '166 Karqo', url: 'https://166karqo.az/', icon: '📦', color: '#2F8FE0' },
  { id: 'elpost', name: 'Elpost', url: 'https://www.elpost.az/', icon: '📮', color: '#E0632F' },
];

export function getCargoCompany(id: string): CargoCompany | undefined {
  return CARGO_COMPANIES.find(c => c.id === id);
}
