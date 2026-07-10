import { debts } from '../data/mockData'

export default function Debts() {
  return (
    <div className="content-card">
      <h2>Borclarım</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>№</th>
            <th>SifarişlərNə</th>
            <th>Səbəb</th>
            <th>Məbləğ</th>
            <th>Qeyd</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {debts.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                Borc yoxdur
              </td>
            </tr>
          ) : debts.map((debt, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{debt.orderId}</td>
              <td>{debt.reason}</td>
              <td>{debt.amount}</td>
              <td>{debt.note}</td>
              <td>{debt.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-footer">
        <strong>Cəmi : 0.00 TL</strong>
        <button className="btn btn-yellow">Borcu ödə</button>
      </div>
    </div>
  )
}
