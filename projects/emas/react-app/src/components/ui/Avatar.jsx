const COLORS = ['c-blue','c-green','c-purple','c-orange','c-teal','c-red']

export default function Avatar({ ad = '', soyad = '', id = 0, size = 'sm' }) {
  const initials = (ad[0] || '') + (soyad[0] || '')
  const cls = COLORS[Math.abs(id - 1) % COLORS.length]
  return (
    <div className={`avatar avatar-${size} ${cls}`}>{initials}</div>
  )
}
