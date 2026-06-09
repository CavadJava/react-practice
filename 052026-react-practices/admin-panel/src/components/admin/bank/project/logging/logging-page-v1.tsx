import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DepositLeftMenu from '../../../menu/depositleftmenu';
const LoggingPage: React.FC = () => {
  const { uniqueId } = useParams<{ uniqueId: string }>();

  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================================
  // 1. FİLTERLƏR ÜÇÜN İKİLİ STATE STRUKTURU
  // ========================================================
  // Ekranda seçilən anlıq dəyərlər üçün
  const [filterInputs, setFilterInputs] = useState({
    lines: '10', // Default olaraq 10 sətir
    order: 'asc' // Default olaraq artan sıra
  });

  // Düyməyə kliklədikdə rəsmi olaraq API-a ötürüləcək dəyərlər üçün
  const [activeFilters, setActiveFilters] = useState({
    lines: '10',
    order: 'asc'
  });

  // ========================================================
  // 2. YENİLƏNMİŞ API SORĞUSU (activeFilters-dən bəhrələnir)
  // ========================================================
  useEffect(() => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
      directorypath: 'home/sanan/notification-admin/logs',
      fileName: 'spring-boot-logging.log',
      lines: activeFilters.lines, // Dinamik filter dəyəri
      order: activeFilters.order  // Dinamik filter dəyəri
    });

    const url = `http://localhost:8087/api/remote-ops/read-logs?${queryParams.toString()}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'instance': 'IPS',
        'environment': 'DEV'
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Log xidməti ilə əlaqə qurulmadı.');
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
  }, [uniqueId, activeFilters]); // activeFilters dəyişdikdə yeni sorğu atılacaq

  // Input və Select dəyişdikdə işləyən funksiya
  const handleFilterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  // "Filter" düyməsinə kliklədikdə işləyən funksiya
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault(); // Səhifənin yenilənməsinin qarşısını alırıq
    setActiveFilters({ ...filterInputs }); // Ekrandakı seçimləri rəsmi filterə ötürür və API-ı tətikləyir
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sol Menyu */}
        <DepositLeftMenu />

        {/* Əsas Log Ekranı */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
          
          {/* Üst Başlıq Hissəsi */}
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
            <h1 className="h2 text-dark">📋 Canlı Log Monitoru</h1>
            <div className="d-flex gap-2">
              <span className="badge bg-success px-2 py-2">ENV: DEV</span>
              <span className="badge bg-info text-dark px-2 py-2">INSTANCE: OP</span>
            </div>
          </div>

          {/* ========================================================
              3. YENİ ƏLAVƏ: LINES VƏ ORDER FİLTER PANELİ
             ======================================================== */}
          <form onSubmit={handleApplyFilters} className="row g-3 align-items-end mb-4 bg-light p-3 rounded border shadow-sm">
            {/* Lines Filter (Sətir Sayı) */}
            <div className="col-md-3">
              <label className="form-label small fw-bold text-secondary">Sətir Sayı (Lines)</label>
              <input 
                type="number" 
                name="lines" 
                className="form-control form-control-sm" 
                placeholder="Örnək: 10"
                min="1"
                max="500"
                value={filterInputs.lines} 
                onChange={handleFilterInputChange}
                disabled={loading}
              />
            </div>

            {/* Order Filter (Sıralama) */}
            <div className="col-md-3">
              <label className="form-label small fw-bold text-secondary">Sıralama (Order)</label>
              <select 
                name="order" 
                className="form-select form-select-sm" 
                value={filterInputs.order} 
                onChange={handleFilterInputChange}
                disabled={loading}
              >
                <option value="asc">Artan Sıra (Ascending)</option>
                <option value="desc">Azalan Sıra (Descending)</option>
              </select>
            </div>

            {/* Filter Button */}
            <div className="col-md-2">
              <button 
                type="submit" 
                className="btn btn-primary btn-sm w-100 fw-semibold d-flex align-items-center justify-content-center gap-1"
                disabled={loading}
              >
                🔍 Filterlə
              </button>
            </div>
          </form>

          {/* Log faylı və Terminal Bloku */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark" role="status" />
              <p className="mt-2 text-muted">Meyarlara uyğun loglar yüklənir...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger shadow-sm">
              <strong>Xəta baş verdi:</strong> {error}
            </div>
          ) : (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center py-2">
                <span className="small font-monospace">spring-boot-logging.log</span>
                <button 
                  type="button"
                  className="btn btn-sm btn-light py-0 px-2 small font-monospace" 
                  onClick={() => setActiveFilters({ ...filterInputs })} // Yenilə düyməsi cari filtrlərlə yenidən çağırır
                  disabled={loading}
                >
                  🔄 Yenilə
                </button>
              </div>
              
              {/* Terminal Görünüşlü Qara Blok (Soldan düzülüşlü - text-start) */}
              <div 
                className="card-body bg-dark text-success p-3 font-monospace rounded-bottom text-start"
                style={{ 
                  maxHeight: '600px', 
                  overflowY: 'auto', 
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: 'inset 0 0 10px #000'
                }}
              >
                {logs.map((line, index) => (
                  <div key={index} className="d-flex align-items-start mb-1 text-start hover-log-line">
                    <span className="text-muted me-3 select-none" style={{ minWidth: '35px', userSelect: 'none', display: 'inline-block' }}>
                      {index + 1}
                    </span>
                    <span className="text-light text-break w-100">{line}</span>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="text-center text-muted py-4">Təyin edilmiş filtrlərə uyğun log tapılmadı.</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LoggingPage;