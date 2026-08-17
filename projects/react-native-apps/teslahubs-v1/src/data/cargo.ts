export type CargoCompany = {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
};

// Seed data only — the actual live list is CRUD-managed and persisted via
// CargoCompaniesContext (AsyncStorage), so more companies can be added,
// edited, or removed from within the app, not just here.
export const DEFAULT_CARGO_COMPANIES: CargoCompany[] = [
  { id: '166karqo', name: '166 Karqo', url: 'https://166karqo.az/', icon: '📦', color: '#2F8FE0' },
  { id: 'elpost', name: 'Elpost', url: 'https://www.elpost.az/', icon: '📮', color: '#E0632F' },
];
