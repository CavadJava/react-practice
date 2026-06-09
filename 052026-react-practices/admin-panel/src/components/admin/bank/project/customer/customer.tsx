import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import LeftMenu from '../../../menu/leftmenu';
import DepositLeftMenu from '../../../menu/depositleftmenu';

// 1. Java-dakı CustomerResponse sinfinə uyğun TypeScript interfeysi qururuq
interface Customer {
  customerId: string;
  pin: string;
  docNumber: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  middleName: string;
  address: string;
  email: string;
}

interface CustomersResponse {
  result: Customer[]; // İndi result sadəcə rəqəm yox, Customer obyektlərinin massividir
  code: number;
  message: string;
}

const CustomersData: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/backoffice/customers')
      .then((response) => {
        if (!response.ok) throw new Error('Şəbəkə xətası baş verdi.');
        return response.json();
      })
      .then((data: CustomersResponse) => {
        if (data.code === 0) {
          setCustomers(data.result);
        } else {
          setError(data.message || 'Məlumatları yükləmək mümkün olmadı.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mt-4 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yüklənir...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger"><strong>Xəta:</strong> {error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <DepositLeftMenu />

      <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
        <h1 className="h2 mb-4">Müştərilər</h1>
        <Link to="/dashboard/bank/monitoring" className="btn btn-secondary mb-4">← Panelə Qayıt</Link>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
          <h2 className="h4 text-secondary fw-bold">Müştəri Portalı / Siyahı</h2>
          <span className="badge bg-dark fs-6 px-3 py-2">Sistemdə: {customers.length} nəfər</span>
        </div>

        {/* 2. Çox sütun olduğu üçün table-responsive istifadə edirik ki, ekran kiçiləndə sürüşdürmək (scroll) mümkün olsun */}
        <div className="table-responsive shadow-sm rounded border bg-white">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead className="table-dark text-nowrap">
              <tr>
                <th>ID</th>
                <th>FİN</th>
                <th>Sənəd No</th>
                <th>Ad, Soyad, Ata adı</th>
                <th>Mobil Nömrə</th>
                <th>Email</th>
                <th>Ünvan</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customerId}>
                  {/* ID */}
                  <td className="fw-bold text-primary">#{customer.customerId}</td>
                  
                  {/* FIN */}
                  <td><code className="text-dark fw-semibold font-monospace">{customer.pin || '---'}</code></td>
                  
                  {/* Sənəd No */}
                  <td className="text-uppercase">{customer.docNumber || '---'}</td>
                  
                  {/* Tam Ad (Ad + Soyad + Ata adı) */}
                  <td className="fw-semibold">
                    {`${customer.lastName} ${customer.firstName} ${customer.middleName || ''}`.trim()}
                  </td>
                  
                  {/* Telefon */}
                  <td className="text-nowrap">{customer.phoneNumber || '---'}</td>
                  
                  {/* Email */}
                  <td>
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="text-decoration-none">
                        {customer.email}
                      </a>
                    ) : (
                      <span className="text-muted">---</span>
                    )}
                  </td>
                  
                  {/* Ünvan */}
                  <td className="text-truncate" style={{ maxWidth: '200px' }} title={customer.address}>
                    {customer.address || '---'}
                  </td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5 fs-5">
                    Göstəriləcək müştəri məlumatı tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
    </div>
  );
};

export default CustomersData;