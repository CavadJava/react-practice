import { useState } from 'react'
import { orderHistory } from '../data/mockData'

export default function Packages() {
  const [filter, setFilter] = useState('Hamısı')
  const [selected, setSelected] = useState([])
  const [promoCode, setPromoCode] = useState('')

  const toggleAll = (e) => {
    setSelected(e.target.checked ? orderHistory.map(o => o.id) : [])
  }

  const toggleOne = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <>
      <div className="content-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ marginBottom: 0 }}>Aktiv bağlamalarım</h2>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px' }}
          >
            <option>Hamısı</option>
            <option>Türkiyə</option>
            <option>ABŞ</option>
            <option>İngiltərə</option>
            <option>Çin</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
          <div className="packages-controls">
            <div className="select-all-row">
              <input
                type="checkbox"
                id="selectAll"
                checked={selected.length === orderHistory.length && orderHistory.length > 0}
                onChange={toggleAll}
              />
              <label htmlFor="selectAll">hamısını seç</label>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong>{selected.length} bağlama seçilib</strong>
              &nbsp;&nbsp;
              <strong>Cəmi :{selected.length > 0 ? '0.00' : '0.00'} AZN</strong>
            </div>

            <div className="payment-bar">
              <input
                type="text"
                placeholder="PROMOKOD"
                className="promo-input"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
              />
              <button className="btn btn-primary">Təsdiq et</button>
              <button className="btn btn-outline">Kartla ödə &rarr;</button>
              <button className="btn btn-yellow">Balansdan ödə &rarr;</button>
            </div>
          </div>
        </div>
      </div>

      <div className="content-card">
        <h2>Sifariş tarixçəsi</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>İzləmə kodu (Gönderi numarası və ya Takip numarası)</th>
                <th>Mağaza</th>
                <th>Məhsul adı</th>
                <th>Məbləğ</th>
                <th>Çəki</th>
                <th>Çatdırılma</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map(order => (
                <tr key={order.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(order.id)}
                        onChange={() => toggleOne(order.id)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <a href="#" className="tracking-link">{order.trackingCode}</a>
                    </div>
                    <span className="shipping-number">{order.shippingNumber}</span>
                  </td>
                  <td>{order.store}</td>
                  <td>{order.product}</td>
                  <td>{order.amount}</td>
                  <td>{order.weight}</td>
                  <td>
                    <div>{order.shipping}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{order.date}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.status}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{order.date}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="page-btn">&lt;</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">&gt;</button>
        </div>
      </div>
    </>
  )
}
