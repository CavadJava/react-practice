import { useEffect } from 'react'

export default function Modal({ show, onHide, title, size = '', footer, children }) {
  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [show])

  if (!show) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onHide()}>
      <div className={`modal-box ${size}`} style={{ maxWidth: size === 'sm' ? 380 : size === 'lg' ? 700 : 500 }}>
        <div className="modal-header px-4 py-3 border-bottom" style={{ background: '#f8f9fb' }}>
          <h5 className="modal-title mb-0">{title}</h5>
          <button className="btn-close" onClick={onHide} />
        </div>
        <div className="modal-body px-4 py-3">{children}</div>
        {footer && (
          <div className="modal-footer px-4 py-3 border-top d-flex justify-content-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
