import React, { useState } from 'react';

// --- 1. TİP TƏYİNLƏRİ (INTERFACES) ---
interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  pin: string;
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

const DepositPage: React.FC = () => {
  // --- 2. MOCK (TEST) DATALARI ---
  const mockCustomers: Customer[] = [
    { customerId: '275277', firstName: 'John', lastName: 'Doe', pin: '7ABC123' },
    { customerId: '30869', firstName: 'Jane', lastName: 'Smith', pin: '5XYZ987' }
  ];

  const mockIntegrations: Integration[] = [
    { id: 1, customerId: '275277', systemName: 'ASAN Login', status: 'ACTIVE', endpoint: '/api/v1/asan' },
    { id: 2, customerId: '30869', systemName: 'MilliÖn API', status: 'FAILED', endpoint: '/api/v1/million' }
  ];

  const mockApplications: Application[] = [
    { appId: 'APP-01', appName: 'Online Deposit Core', version: 'v2.4.1', status: 'UP' },
    { appId: 'APP-02', appName: 'Notification Service', version: 'v1.0.2', status: 'DOWN' }
  ];

  // --- 3. AXTARIŞ STATE-LƏRİ ---
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [integrationSearch, setIntegrationSearch] = useState<string>('');
  const [appSearch, setAppSearch] = useState<string>('');

  // --- 4. FİLTRLƏMƏ MƏNTİQİ ---
  // 1-ci Cədvəl üçün filter (CustomerId-yə görə)
  const filteredCustomers = mockCustomers.filter(c =>
    c.customerId.includes(customerSearch)
  );

  // 2-ci Cədvəl üçün filter (CustomerId-yə görə)
  const filteredIntegrations = mockIntegrations.filter(i =>
    i.customerId.includes(integrationSearch)
  );

  // 3-cü Cədvəl üçün filter (AppId-yə görə)
  const filteredApplications = mockApplications.filter(a =>
    a.appId.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4 text-secondary border-bottom pb-2fw-bold">Backoffice Monitorinq Paneli</h2>

      {/* ========================================================
          1. CƏDVƏL: CUSTOMER TABLE (Filter: customerId)
         ======================================================== */}
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Müştəri Məlumatları (Müştəri ID-yə görə filter)</h5>
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
              />
            </div>
          </div>
          {/* Cədvəl */}
          <div className="table-responsive">
            <table className="table table-hover border">
              <thead className="table-light">
                <tr>
                  <th>Müştəri ID</th>
                  <th>Ad</th>
                  <th>Soyad</th>
                  <th>FİN</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.customerId}>
                    <td className="fw-bold text-primary">#{c.customerId}</td>
                    <td>{c.firstName}</td>
                    <td>{c.lastName}</td>
                    <td><code>{c.pin}</code></td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted py-3">Müştəri tapılmadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CƏDVƏL: INTEGRATION TABLE (Filter: customerId)
         ======================================================== */}
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Sistem İnteqrasiyaları (Müştəri ID-yə görə filter)</h5>
        </div>
        <div className="card-body">
          {/* Axtarış Inputu */}
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
          {/* Cədvəl */}
          <div className="table-responsive">
            <table className="table table-hover border">
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
                    <td>
                      <span className={`badge ${i.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredIntegrations.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted py-3">İnteqrasiya məlumatı tapılmadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CƏDVƏL: APPLICATION TABLE (Filter: appId)
         ======================================================== */}
      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Tətbiqlər / Servislər (App ID-yə görə filter)</h5>
        </div>
        <div className="card-body">
          {/* Axtarış Inputu */}
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
          {/* Cədvəl */}
          <div className="table-responsive">
            <table className="table table-hover border">
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
                    <td>
                      <span className={`badge ${a.status === 'UP' ? 'bg-success' : 'bg-danger'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted py-3">Tətbiq tapılmadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DepositPage;