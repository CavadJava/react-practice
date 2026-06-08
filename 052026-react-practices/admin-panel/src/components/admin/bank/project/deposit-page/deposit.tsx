import React, { useState, useEffect } from 'react';

// --- 1. TİP TƏYİNLƏRİ (INTERFACES) ---
interface Customer {
  customerId: string;
  pin: string;
  docNumber: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  address?: string;
  email?: string;
}

interface CustomersResponse {
  result: Customer[];
  code: number;
  message: string;
}

interface Integration {
  id: number;
  customerId: string;
  systemName: string;
  status: 'ACTIVE' | 'FAILED';
  endpoint: string;
}

interface Application {
  appId: string;
  appName: string;
  version: string;
  status: 'UP' | 'DOWN';
}

const BackofficeDashboard: React.FC = () => {
  // --- 2. MOCK DATALAR (2-ci və 3-cü cədvəllər üçün) ---
  const mockIntegrations: Integration[] = [
    { id: 1, customerId: '275277', systemName: 'ASAN Login', status: 'ACTIVE', endpoint: '/api/v1/asan' },
    { id: 2, customerId: '30869', systemName: 'MilliÖn API', status: 'FAILED', endpoint: '/api/v1/million' }
  ];

  const mockApplications: Application[] = [
    { appId: 'APP-01', appName: 'Online Deposit Core', version: 'v2.4.1', status: 'UP' },
    { appId: 'APP-02', appName: 'Notification Service', version: 'v1.0.2', status: 'DOWN' }
  ];

  // --- 3. STATE-LƏR (Müştəri API-ı üçün və Axtarışlar üçün) ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [integrationSearch, setIntegrationSearch] = useState<string>('');
  const [appSearch, setAppSearch] = useState<string>('');

  // --- 4. SƏNİN TƏQDİM ETDİYİN API SORĞUSU (useEffect) ---
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

  // --- 5. FİLTRLƏMƏ MƏNTİQİ ---
  // API-dan gələn real customers massivini filter edirik
  const filteredCustomers = customers.filter(c =>
    c.customerId.includes(customerSearch)
  );

  const filteredIntegrations = mockIntegrations.filter(i =>
    i.customerId.includes(integrationSearch)
  );

  const filteredApplications = mockApplications.filter(a =>
    a.appId.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4 text-secondary border-bottom pb-2 fw-bold">Backoffice Monitorinq Paneli</h2>

      {/* ========================================================
          1. CƏDVƏL: CUSTOMER TABLE (Real API-a bağlıdır)
         ======================================================== */}
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Müştəri Məlumatları</h5>
          {!loading && !error && <span className="badge bg-light text-primary">Cəmi: {filteredCustomers.length}</span>}
        </div>
        <div className="card-body">
          {/* Axtarış Inputu */}
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Müştəri ID daxil edin... (örn: 275277)"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                disabled={loading || !!error} // Yüklənərkən və ya xəta olanda input bağlansın
              />
            </div>
          </div>

          {/* Şərtli Render: Loading, Error və ya Cədvəlin özü */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yüklənir...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger mb-0"><strong>Xəta:</strong> {error}</div>
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
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => (
                    <tr key={c.customerId}>
                      <td className="fw-bold text-primary">#{c.customerId}</td>
                      <td><code className="text-dark font-monospace">{c.pin || '---'}</code></td>
                      <td>{c.docNumber || '---'}</td>
                      <td>{`${c.firstName} ${c.lastName}`}</td>
                      <td>{c.phoneNumber || '---'}</td>
                      <td>{c.email || '---'}</td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted py-3">Axtarışa uyğun müştəri tapılmadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          2. CƏDVƏL: INTEGRATION TABLE 
         ======================================================== */}
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Sistem İnteqrasiyaları</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Müştəri ID-yə görə inteqrasiya axtar..."
                value={integrationSearch}
                onChange={(e) => setIntegrationSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover border mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Müştəri ID</th>
                  <th>Sistem Adı</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIntegrations.map(i => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td className="fw-bold">#{i.customerId}</td>
                    <td>{i.systemName}</td>
                    <td><code>{i.endpoint}</code></td>
                    <td><span className={`badge ${i.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CƏDVƏL: APPLICATION TABLE
         ======================================================== */}
      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Tətbiqlər / Servislər</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="App ID daxil edin... (örn: APP-01)"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover border mb-0">
              <thead className="table-light">
                <tr>
                  <th>App ID</th>
                  <th>Tətbiq Adı</th>
                  <th>Versiya</th>
                  <th>Server Vəziyyəti</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map(a => (
                  <tr key={a.appId}>
                    <td className="fw-bold text-secondary">{a.appId}</td>
                    <td>{a.appName}</td>
                    <td><span className="badge bg-secondary">{a.version}</span></td>
                    <td><span className={`badge ${a.status === 'UP' ? 'bg-success' : 'bg-danger'}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BackofficeDashboard;