import { useEffect, useState } from "react";
import type { Customer, CustomersResponse } from "../projectsData";

const CustomerV1 = () => {
    
      // --- 3. STATE-LƏR ---
      // 1-ci Cədvəl üçün state-lər
      const [customers, setCustomers] = useState<Customer[]>([]);
      const [custLoading, setCustLoading] = useState<boolean>(true);
      const [custError, setCustError] = useState<string | null>(null);
      const [customerSearch, setCustomerSearch] = useState<string>('');
      
    
      
      // Müştəriləri çəkən sorğu (Client-side filter üçün 1 dəfə yüklənir)
      useEffect(() => {
        fetch('http://localhost:8080/backoffice/customers')
          .then(res => { if (!res.ok) throw new Error('Müştəri xidmətində şəbəkə xətası.'); return res.json(); })
          .then((data: CustomersResponse) => {
            if (data.code === 0) setCustomers(data.result);
            else setCustError(data.message);
            setCustLoading(false);
          })
          .catch(err => { setCustError(err.message); setCustLoading(false); });
      }, []);
    
      // --- 5. FİLTRLƏMƏ FUNKSİYALARI (Lokal) ---
      const filteredCustomers = customers.filter(c =>
        (c.customerId || '').includes(customerSearch)
      );

    return (
        /* ========================================================
          1. CƏDVƏL: CUSTOMER TABLE (Real API)
         ======================================================== */
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Müştəri Məlumatları (Müştəri ID-yə görə filter)</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Müştəri ID daxil edin... (örn: 275277)"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                disabled={custLoading}
              />
            </div>
          </div>

          {custLoading ? (
            <div className="text-center py-3"><div className="spinner-border text-primary" /></div>
          ) : custError ? (
            <div className="alert alert-danger">{custError}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover border mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Müştəri ID</th>
                    <th>FİN</th>
                    <th>Sənəd No</th>
                    <th>Ad, Soyad</th>
                    <th>Mobil Nömrə</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => (
                    <tr key={c.customerId}>
                      <td className="fw-bold text-primary">#{c.customerId}</td>
                      <td><code>{c.pin || '---'}</code></td>
                      <td>{c.docNumber || '---'}</td>
                      <td>{`${c.firstName} ${c.lastName}`}</td>
                      <td>{c.phoneNumber || '---'}</td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-3">Müştəri tapılmadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
};

export default CustomerV1;