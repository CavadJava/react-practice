const MAP = {
  'Aktiv':       'bs-active',
  'Gözləyən':    'bs-pending',
  'Qeyri-aktiv': 'bs-inactive',
  'Bloklanmış':  'bs-suspended',
  'Bloklanan':   'bs-suspended',
  'Təsdiqlənmiş':'bs-approved',
  'Rədd Edilmiş':'bs-rejected',
  'Baxılır':     'bs-review',
}

const ROLE_MAP = { Admin:'role-admin', Manager:'role-manager', Operator:'role-operator', Viewer:'role-viewer' }

export function StatusBadge({ status }) {
  return <span className={`badge-status ${MAP[status] || 'bs-review'}`}>{status}</span>
}

export function RoleBadge({ role }) {
  return <span className={`role-badge ${ROLE_MAP[role] || ''}`}>{role}</span>
}
