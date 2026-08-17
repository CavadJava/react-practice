export default function Panel({ title, icon, iconCls, actions, children, className = '' }) {
  return (
    <div className={`panel ${className}`}>
      {(title || actions) && (
        <div className="panel-header">
          <h5>
            {icon && <i className={`bi ${icon} me-2 ${iconCls || ''}`}></i>}
            {title}
          </h5>
          {actions && <div className="d-flex gap-2 align-items-center">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
