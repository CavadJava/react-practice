import { useState } from 'react'
import { balanceHistory } from '../data/mockData'

export default function Balance() {
  const [amount, setAmount] = useState('')

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="balance-card">
          <h2>Daşınma balansı</h2>
          <p>Daşınma balansı</p>
          <div className="balance-amount">0.00 AZN</div>
        </div>

        <div className="content-card" style={{ margin: 0 }}>
          <h2>Balansı artır (AZN)</h2>
          <input
            className="form-control"
            placeholder="Məbləği daxil et (AZN)"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <button className="btn btn-green" style={{ width: '100%', padding: '10px' }}>
            Balansı artır &rarr;
          </button>
        </div>
      </div>

      <div className="content-card">
        <div style={{ marginBottom: 12 }}>
          <p className="warn-text">Balansa artırdığınız məbləğ ilə yalnız çatdırılma haqqını ödəyə bilərsiniz!</p>
          <p className="warn-text">Ödənilən məbləğ geri qaytarılmır!</p>
        </div>

        <h2>Balans tarixçəsi</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tarix</th>
              <th>Ödəniş</th>
              <th>Qalıq</th>
            </tr>
          </thead>
          <tbody>
            {balanceHistory.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  Tarixçə yoxdur
                </td>
              </tr>
            ) : balanceHistory.map((item, i) => (
              <tr key={i}>
                <td>{item.date}</td>
                <td>{item.payment}</td>
                <td>{item.remaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
