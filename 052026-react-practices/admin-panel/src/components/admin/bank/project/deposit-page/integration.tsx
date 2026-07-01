import { useState } from "react";
import type { Integration } from "../projectsData";

const IntegrationV1 = () => {
  // --- 2. MOCK DATALAR (Sənin kodundakı kimi 2-ci cədvəl üçün qorundu) ---
  const mockIntegrations: Integration[] = [
    { id: 1, customerId: '275277', systemName: 'ASAN Login', status: 'ACTIVE', endpoint: '/api/v1/asan' },
    { id: 2, customerId: '30869', systemName: 'MilliÖn API', status: 'FAILED', endpoint: '/api/v1/million' }
  ];


    
      // 2-ci Cədvəl üçün state
      const [integrationSearch, setIntegrationSearch] = useState<string>('');


  const filteredIntegrations = mockIntegrations.filter(i =>
    (i.customerId || '').includes(integrationSearch)
  );
    return (
        
        /* ========================================================
          2. CƏDVƏL: INTEGRATION TABLE (Sənin kodundakı struktur)
         ======================================================== */
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

    );
}
export default IntegrationV1;