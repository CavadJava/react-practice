import { useState } from "react";
import { ApplicationStatus, ApplicationType, type Application } from "../projectsData";

const ApplicationData = () => {


    
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
        
          // Yazmağa davam etdikdə işləyən funksiya (Saniyədə 100 dəfə işləsə də API-a toxunmur)
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInputValues(prev => ({ ...prev, [name]: value }));
        };
    
        // Inputdan çıxıb kənara kliklədikdə işləyən FUNKSİYA (onBlur)
        const handleInputBlur = () => {
        // Yazılan bütün dəyərləri rəsmi olaraq API state-inə köçürürük
        setAppFilters({ ...inputValues });
        };


    return (

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
            {/* <div className="col">
              <input type="text" name="status" className="form-control form-control-sm" placeholder="Status" 
                value={inputValues.status} onChange={handleInputChange} onBlur={handleInputBlur} />
            </div>
            <div className="col">
              <input type="text" name="type" className="form-control form-control-sm" placeholder="Növü (Type)" 
                value={inputValues.type} onChange={handleInputChange} onBlur={handleInputBlur} />
            </div> */}

            {/* STATUS SELECT (ENUM-dan oxuyur) */}
            <div className="col">
              <select name="status" className="form-select form-select-sm" value={inputValues.status} onChange={handleInputChange} onBlur={handleInputBlur}>
                <option value="">Status Seçin (Hamısı)</option>
                {Object.values(ApplicationStatus).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            
            {/* NÖVÜ/TYPE SELECT (ENUM-dan oxuyur) */}
            <div className="col">
              <select name="type" className="form-select form-select-sm" value={inputValues.type} onChange={handleInputChange} onBlur={handleInputBlur}>
                <option value="">Növ Seçin (Hamısı)</option>
                {Object.values(ApplicationType).map(val => (
                  <option key={val} value={val}>{val.replace('_', ' ')}</option>
                ))}
              </select>
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
    );
};

export default ApplicationData;