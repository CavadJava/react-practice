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

// Yeni göndərdiyin Java ApplicationResponse modelinə uyğun interfeys
interface Application {
  customerId: number;
  applicationId: number;
  applicationNumber: string;
  status: string;
  type: string;
}

interface ApplicationsResponse {
  result: Application[];
  code: number;
  message: string;
}

const DepositPage: React.FC = () => {
  // --- 2. MOCK DATALAR (Sənin kodundakı kimi 2-ci cədvəl üçün qorundu) ---
  const mockIntegrations: Integration[] = [
    { id: 1, customerId: '275277', systemName: 'ASAN Login', status: 'ACTIVE', endpoint: '/api/v1/asan' },
    { id: 2, customerId: '30869', systemName: 'MilliÖn API', status: 'FAILED', endpoint: '/api/v1/million' }
  ];

  // --- 3. STATE-LƏR ---
  // 1-ci Cədvəl üçün state-lər
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custLoading, setCustLoading] = useState<boolean>(true);
  const [custError, setCustError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // 2-ci Cədvəl üçün state
  const [integrationSearch, setIntegrationSearch] = useState<string>('');

  // 3-cü Cədvəl (Applications) üçün API və çoxlu filter state-ləri
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState<boolean>(true);
  const [appsError, setAppsError] = useState<string | null>(null);

  // 1. Yazılan hərfləri anlıq tutmaq üçün (Smooth typing)
  const [inputValues, setInputValues] = useState({
    customerId: '',
    applicationId: '',
    applicationNumber: '',
    status: '',
    type: ''
  });
  
  const [appFilters, setAppFilters] = useState({
    customerId: '',
    applicationId: '',
    applicationNumber: '',
    status: '',
    type: ''
  });

  // --- 4. API SORĞULARI (EFFECTS) ---

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

  // Müraciətləri çəkən dinamik sorğu (Server-side filter + Debounce ilə)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setAppsLoading(true);

      const queryParams = new URLSearchParams();
      if (appFilters.customerId.trim()) queryParams.append('customerId', appFilters.customerId.trim());
      if (appFilters.applicationId.trim()) queryParams.append('applicationId', appFilters.applicationId.trim());
      if (appFilters.applicationNumber.trim()) queryParams.append('applicationNumber', appFilters.applicationNumber.trim());
      if (appFilters.status.trim()) queryParams.append('status', appFilters.status.trim());
      if (appFilters.type.trim()) queryParams.append('type', appFilters.type.trim());

      const url = `http://localhost:8080/backoffice/applications?${queryParams.toString()}`;

      fetch(url)
        .then(res => { if (!res.ok) throw new Error('Müraciət xidmətində şəbəkə xətası.'); return res.json(); })
        .then((data: ApplicationsResponse) => {
          if (data.code === 0) {
            setApplications(data.result);
          } else {
            setAppsError(data.message);
          }
          setAppsLoading(false);
        })
        .catch((err) => 
          { 
            setAppsError(err.message); setAppsLoading(false); 
          }
        );
    }, 400); // İstifadəçi yazmağı bitirəndən 400ms sonra API-a sorğu atır

    return () => clearTimeout(delayDebounceFn);
  }, [appFilters]);

  // Yazmağa davam etdikdə işləyən funksiya (Saniyədə 100 dəfə işləsə də API-a toxunmur)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValues(prev => ({ ...prev, [name]: value }));
  };

  // Inputdan çıxıb kənara kliklədikdə işləyən FUNKSİYA (onBlur)
  const handleInputBlur = () => {
    // Yazılan bütün dəyərləri rəsmi olaraq API state-inə köçürürük
    setAppFilters({ ...inputValues });
  };

  // --- 5. FİLTRLƏMƏ FUNKSİYALARI (Lokal) ---
  const filteredCustomers = customers.filter(c =>
    (c.customerId || '').includes(customerSearch)
  );

  const filteredIntegrations = mockIntegrations.filter(i =>
    (i.customerId || '').includes(integrationSearch)
  );

  const handleAppFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAppFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4 text-secondary border-bottom pb-2 fw-bold">Backoffice Monitorinq Paneli</h2>

      {/* ========================================================
          1. CƏDVƏL: CUSTOMER TABLE (Real API)
         ======================================================== */}
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

      {/* ========================================================
          2. CƏDVƏL: INTEGRATION TABLE (Sənin kodundakı struktur)
         ======================================================== */}
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Sistem İnteqrasiyaları (Müştəri ID-yə görə filter)</h5>
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
          3. CƏDVƏL: APPLICATION TABLE (Kənara klikləyəndə aktivləşir)
         ======================================================== */}
      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Müraciətlər / Applications (Kənara kliklədikdə axtarır)</h5>
          {!appsLoading && !appsError && <span className="badge bg-secondary">Tapıldı: {applications.length}</span>}
        </div>
        <div className="card-body">
          
          {/* FİLTER INPUTLARI - onChange və onBlur birlikdə istifadə olunur */}
          <div className="row g-2 mb-3 bg-light p-3 rounded border">
            <div className="col">
              <input type="text" name="customerId" className="form-control form-control-sm" placeholder="Müştəri ID" 
                value={inputValues.customerId} onChange={handleInputChange} onBlur={handleInputBlur} />
            </div>
            <div className="col">
              <input type="text" name="applicationId" className="form-control form-control-sm" placeholder="Müraciət ID" 
                value={inputValues.applicationId} onChange={handleInputChange} onBlur={handleInputBlur} />
            </div>
            <div className="col">
              <input type="text" name="applicationNumber" className="form-control form-control-sm" placeholder="Müraciət No" 
                value={inputValues.applicationNumber} onChange={handleInputChange} onBlur={handleInputBlur} />
            </div>
            <div className="col">
              <input type="text" name="status" className="form-control form-control-sm" placeholder="Status" 
                value={inputValues.status} onChange={handleInputChange} onBlur={handleInputBlur} />
            </div>
            <div className="col">
              <input type="text" name="type" className="form-control form-control-sm" placeholder="Növü (Type)" 
                value={inputValues.type} onChange={handleInputChange} onBlur={handleInputBlur} />
            </div>
          </div>

          {appsLoading ? (
            <div className="text-center py-4"><div className="spinner-border text-dark" /></div>
          ) : appsError ? (
            <div className="alert alert-danger mb-0"><strong>Xəta:</strong> {appsError}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover border mb-0 align-middle">
                <thead className="table-dark">
                  <tr><th>Müştəri ID</th><th>Müraciət ID</th><th>Müraciət Nömrəsi</th><th>Növü (Type)</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.applicationId}>
                      <td>#{app.customerId}</td>
                      <td className="fw-bold text-secondary">{app.applicationId}</td>
                      <td><code>{app.applicationNumber || '---'}</code></td>
                      <td><span className="badge bg-info text-dark text-uppercase">{app.type || '---'}</span></td>
                      <td>
                        <span className={`badge ${app.status?.toUpperCase() === 'SUCCESS' || app.status?.toUpperCase() === 'APPROVED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {app.status || 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-3">Bu parametrlərə uyğun müraciət tapılmadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DepositPage;