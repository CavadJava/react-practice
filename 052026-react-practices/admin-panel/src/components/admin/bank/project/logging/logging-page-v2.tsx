import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsData, type ApplicationStatus, type ApplicationType } from '../projectsData';

export interface Application {
  customerId: number;
  applicationId: number;
  applicationNumber: string;
  status: ApplicationStatus;
  type: ApplicationType;
}

export interface ApplicationsResponse {
  result: Application[];
  code: number;
  message: string;
}

export const LoggingPageV2: React.FC = () => {
  const { uniqueId } = useParams<{ uniqueId: string }>();
  const project = projectsData.find((p) => p.uniqueId === uniqueId);

  // --- STATE-LƏR ---
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ekranda seçilən anlıq dəyərlər (Smooth inputs)
  const [filterInputs, setFilterInputs] = useState({
    lines: '10',
    order: 'asc',
    nohup: false, // Checkbox üçün boolean
    nohupValue: 'nohup.out' // Textfield üçün default dəyər
  });

  // Yalnız "Filterlə" düyməsinə kliklədikdə API-ı tətikləyəcək rəsmi state
  const [activeFilters, setActiveFilters] = useState({
    lines: '10',
    order: 'asc',
    nohup: false,
    nohupValue: 'nohup.out'
  });

  // --- LOGLARI BACKEND-DƏN ÇƏKƏN API EFFECT-İ ---
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Düzəliş məntiqi: Əgər nohup seçilibsə, istifadəçinin yazdığı fayl adını, seçilməyibsə standart log adını götürürük
    const targetFileName = activeFilters.nohup 
      ? (activeFilters.nohupValue.trim() || 'nohup.out') 
      : 'spring-boot-logging.log';

    const queryParams = new URLSearchParams({
      directoryName: `${project?.environments.prod.serviceName || ''}`,
      fileName: targetFileName, // Dinamik təyin olunmuş fayl adı
      lines: activeFilters.lines,
      order: activeFilters.order
    });

    const url = `http://localhost:8087/api/remote-ops/read-logs?${queryParams.toString()}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'instance': 'IPS',       
        'environment': 'PROD2'    
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Log xidməti ilə əlaqə qurulmadı (Şəbəkə xətası).');
        return res.json();
      })
      .then((data: string[]) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [uniqueId, activeFilters, project]);

  // Input, Select və Checkbox dəyişəndə işləyən vahid funksiya
  const handleFilterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    
    // Əgər dəyişən element checkbox-dırsa "checked" dəyərini, yoxsa normal "value" dəyərini mənimsədirik
    const targetValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFilterInputs(prev => {
      const updated = { ...prev, [name]: targetValue };
      
      // Əgər istifadəçi nohup checkbox-nı söndürürsə, textfield-i default "nohup.out" dəyərinə sıfırlasın
      if (name === 'nohup' && !targetValue) {
        updated.nohupValue = 'nohup.out';
      }
      return updated;
    });
  };

  // Form submit (Filterlə düyməsi) olunanda işləyən funksiya
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({ ...filterInputs });
  };

  // Səhifə daxilində və başlıqda dinamik görünəcək fayl adı
  const currentDisplayFile = activeFilters.nohup ? activeFilters.nohupValue : 'spring-boot-logging.log';

  return (
    <div className="container-fluid">
      <div className="row">
        
        {/* ========================================================
            SOL MENYU (SIDEBAR) INTEGRASIYASI
           ======================================================== */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar vh-100 p-3 text-white collapse shadow" style={{ minHeight: '100vh' }}>
          <h4 className="text-center mb-4 pdf-2 border-bottom border-secondary fw-bold text-info">Admin Panel</h4>
          <ul className="nav flex-column gap-2">
            <li className="nav-item">
              <a className="nav-link text-white d-flex align-items-center gap-2 rounded hover-effect" href="/dashboard/bank/monitoring">
                <span>📊</span> Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white-50 d-flex align-items-center gap-2 rounded hover-effect" href="/dashboard/users">
                <span>👥</span> İstifadəçilər
              </a>
            </li>
            <li className="nav-item">
              <a 
                className="nav-link text-white d-flex align-items-center justify-content-between rounded bg-primary" 
                data-bs-toggle="collapse" 
                href="#monitoringSubmenu" 
                role="button" 
                aria-expanded="true"
              >
                <div className="d-flex align-items-center gap-2">
                  <span>⚙️</span> Servis İdarəetməsi
                </div>
                <span className="small">▼</span>
              </a>

              <div className="collapse show ps-3 mt-1" id="monitoringSubmenu">
                <ul className="nav flex-column gap-1 border-start border-secondary ps-2">
                  <li className="nav-item">
                    <a className="nav-link text-white py-1 small d-flex align-items-center gap-2 fw-bold text-info" href={`/dashboard/bank/project/${uniqueId}/logging-page`}>
                      🖥️ Resurslara Bax (Log)
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link text-white-50 py-1 small d-flex align-items-center gap-2" href="/dashboard/customers">
                      🗂️ Müştərilərə Bax
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link text-white-50 py-1 small d-flex align-items-center gap-2" href="/dashboard/deposits">
                      💰 Depozit Əməliyyatları
                    </a>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </nav>

        {/* ========================================================
            ƏSAS LOG MONITORINQ SAHƏSİ (MAIN CONTENT)
           ======================================================== */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4 bg-white">
          
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
            <h1 className="h2 text-dark m-0 fw-bold">📋 Canlı Log Monitoru</h1>
            <div className="d-flex gap-2">
              <span className="badge bg-success px-3 py-2 fs-6 shadow-sm">ENV: DEV</span>
              <span className="badge bg-info text-dark px-3 py-2 fs-6 shadow-sm">INSTANCE: OP</span>
            </div>
          </div>

          {/* ========================================================
              FİLTER PANELİ (Yenilənmiş Grid Sistemi)
             ======================================================== */}
          <form onSubmit={handleApplyFilters} className="row g-3 align-items-end mb-4 bg-light p-3 rounded border shadow-sm mx-0">
            {/* Sətir Sayı */}
            <div className="col-md-3">
              <label className="form-label small fw-bold text-secondary">Sətir Sayı (Lines)</label>
              <input 
                type="number" 
                name="lines" 
                className="form-control form-control-sm" 
                min="1" 
                max="1000" 
                value={filterInputs.lines} 
                onChange={handleFilterInputChange}
                disabled={loading}
              />
            </div>

            {/* Sıralama */}
            <div className="col-md-3">
              <label className="form-label small fw-bold text-secondary">Sıralama (Order)</label>
              <select 
                name="order" 
                className="form-select form-select-sm" 
                value={filterInputs.order} 
                onChange={handleFilterInputChange}
                disabled={loading}
              >
                <option value="asc">Artan Sıra (Köhnədən Yeniyə)</option>
                <option value="desc">Azalan Sıra (Yenidən Köhnəyə)</option>
              </select>
            </div>

            {/* DÜZƏLİŞ: NOHUP CHECKBOX FİLTRİ */}
            <div className="col-md-2 d-flex align-items-center justify-content-center" style={{ height: '38px' }}>
              <div className="form-check form-switch mb-0">
                <input 
                  type="checkbox" 
                  name="nohup" 
                  id="nohupCheckbox"
                  className="form-check-input" 
                  checked={filterInputs.nohup}
                  onChange={handleFilterInputChange}
                  disabled={loading}
                />
                <label className="form-check-label small fw-bold text-secondary" htmlFor="nohupCheckbox">
                  nohup aktiv et
                </label>
              </div>
            </div>

            {/* DÜZƏLİŞ: NOHUP TEXTFIELD (Checkbox aktiv deyilsə disabled olur) */}
            <div className="col-md-2">
              <label className="form-label small fw-bold text-secondary">Nohup Fayl Adı</label>
              <input 
                type="text" 
                name="nohupValue" 
                className="form-control form-control-sm"
                placeholder="Örnək: nohup.out"
                value={filterInputs.nohupValue} 
                onChange={handleFilterInputChange}
                disabled={loading || !filterInputs.nohup} // Checkbox sönülüdürsə kilidlənsin
              />
            </div>

            {/* Filterlə Düyməsi */}
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary btn-sm w-100 fw-semibold py-1.5" disabled={loading}>
                🔍 Filterlə
              </button>
            </div>
          </form>

          {/* YÜKLƏNMƏ, XƏTA VƏ LOG TERMINALI */}
          {loading ? (
            <div className="text-center py-5 my-5">
              <div className="spinner-border text-dark mb-2" role="status" />
              <p className="text-muted font-monospace">Log sətirləri serverdən oxunur...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger shadow-sm border-start border-danger border-3">
              <h5 className="alert-heading fw-bold">Bağlantı Xətası!</h5>
              <p className="mb-0"><strong>Təfərrüat:</strong> {error}</p>
            </div>
          ) : (
            
            /* PEŞƏKAR TERMINAL GÖRÜNÜŞÜ (IDE Style) */
            <div className="card shadow border-0 overflow-hidden">
              <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center py-2">
                {/* DÜZƏLİŞ: Başlıq adı artıq dinamik olaraq cari oxunan faylı göstərir */}
                <span className="small font-monospace fw-semibold">📄 {currentDisplayFile}</span>
                <button 
                  type="button" 
                  className="btn btn-sm btn-light py-0 px-3 small font-monospace shadow-sm fw-semibold"
                  onClick={() => setActiveFilters({ ...filterInputs })}
                  disabled={loading}
                >
                  🔄 Yenilə
                </button>
              </div>
              
              <div 
                className="card-body p-0 font-monospace text-start"
                style={{ 
                  maxHeight: '600px', 
                  overflowY: 'auto', 
                  overflowX: 'auto', 
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  backgroundColor: '#1e1e1e', 
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
                }}
              >
                {logs.map((line, index) => {
                  let logLevelClass = 'text-light';
                  if (line.includes('INFO')) logLevelClass = 'text-info'; 
                  if (line.includes('WARN')) logLevelClass = 'text-warning'; 
                  if (line.includes('ERROR')) logLevelClass = 'text-danger fw-bold'; 

                  return (
                    <div 
                      key={index} 
                      className="d-flex align-items-center py-0.5 px-3 hover-log-line"
                      style={{
                        backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        whiteSpace: 'pre', 
                        minWidth: 'max-content'
                      }}
                    >
                      <span 
                        className="text-muted me-3 select-none text-end border-end pe-2" 
                        style={{ minWidth: '45px', userSelect: 'none', fontSize: '0.8rem', color: '#6e7681' }}
                      >
                        {index + 1}
                      </span>
                      <span className={logLevelClass}>{line}</span>
                    </div>
                  );
                })}

                {logs.length === 0 && (
                  <div className="text-center text-muted py-5 font-monospace">
                    {currentDisplayFile} faylı daxilində oxunacaq log sətri tapılmadı.
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
      
      <style>{`
        .hover-log-line:hover {
          background-color: rgba(255, 255, 255, 0.07) !important;
          transition: background-color 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoggingPageV2;