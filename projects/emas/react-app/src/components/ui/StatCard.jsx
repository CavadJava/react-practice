export default function StatCard({ label, value, change, changeUp, icon, colorCls }) {
  return (
    <div className="stat-card">
      <div>
        <div className="s-label">{label}</div>
        <div className="s-val">{value}</div>
        {change && (
          <div className={`s-change ${changeUp ? 'up' : 'down'}`}>
            <i className={`bi bi-arrow-${changeUp ? 'up' : 'down'}-short`}></i>
            {change}
          </div>
        )}
      </div>
      <div className={`s-icon ${colorCls}`}>
        <i className={`bi ${icon}`}></i>
      </div>
    </div>
  )
}
