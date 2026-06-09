import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DepositLeftMenu from '../../menu/depositleftmenu';

const LoggingPage: React.FC = () => {
  const { uniqueId } = useParams<{ uniqueId: string }>();

  // --- 1. LOGLAR ÜÇÜN STATE-LƏR ---
  const [logs, setLogs] = useState<string[]>([]); // ["a", "b"] massivini tutmaq üçün
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- 2. CURL SORĞUSUNUN FECH İLƏ İMPLEMENTASİYASI ---
  useEffect(() => {
    setLoading(true);
    setError(null);

    // URL Parametrlərini hazırlayırıq (Sənin cURL sorğundakı dəyərlər)
    const queryParams = new URLSearchParams({
      directorypath: 'home/sanan/notification-admin/logs',
      fileName: 'spring-boot-logging.log',
      lines: '10',
      order: 'asc'
    });

    // Port sənin curl-ində 8087-dir, ona diqqət et!
    const url = `http://localhost:8087/api/remote-ops/read-logs?${queryParams.toString()}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'instance': 'IPS',       // cURL-dən gələn xüsusi header
        'environment': 'DEV'    // cURL-dən gələn xüsusi header
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Log xidməti ilə əlaqə qurulmadı.');
        return res.json();
      })
      .then((data: string[]) => {
        // Data birbaşa ["a", "b"] massivi kimi gəldiyi üçün birbaşa dövlətə yazırıq
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [uniqueId]);

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sol Menyu */}
        <DepositLeftMenu />

        {/* Əsas Log Ekranı */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
            <h1 className="h2 text-dark">📋 Canlı Log Monitoru</h1>
            <div className="d-flex gap-2">
              <span className="badge bg-success">ENV: DEV</span>
              <span className="badge bg-info text-dark">INSTANCE: OP</span>
            </div>
          </div>

          {/* Yüklənmə və Xəta İndikatorları */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark" role="status" />
              <p className="mt-2 text-muted">Loglar oxunur, gözləyin...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger shadow-sm">
              <strong>Xəta baş verdi:</strong> {error}
            </div>
          ) : (
            // --- 3. TERMINAL STİLİNDƏ LOG EKRANI ---
            <div className="card shadow-sm border-0">
              <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center py-2">
                <span className="small font-monospace">spring-boot-logging.log</span>
                <button className="btn btn-sm btn-light py-0 px-2 small font-monospace" onClick={() => window.location.reload()}>
                  🔄 Yenilə
                </button>
              </div>
              
              {/* Terminal Görünüşlü Qara Blok */}
              <div 
                className="card-body bg-dark text-success p-3 font-monospace rounded-bottom"
                style={{ 
                  maxHeight: '500px', 
                  overflowY: 'auto', 
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: 'inset 0 0 10px #000'
                }}
              >
                {logs.map((line, index) => (
                // text-start burada da hər sətrin mütləq soldan başlamasını sığortalayır
                <div key={index} className="d-flex align-items-start text-start mb-1 hover-log-line">
                    {/* Sətir Nömrəsi (Sol tərəfdə boz rəngdə) */}
                    <span className="text-muted me-3 select-none" style={{ minWidth: '25px', userSelect: 'none' }}>
                      {index + 1}
                    </span>
                    {/* Log Mətni */}
                    <span className="text-light text-break">{line}</span>
                  </div>
                ))}

                {/* Əgər log faylı boşdursa */}
                {logs.length === 0 && (
                  <div className="text-center text-muted py-4">Fayl daxilində heç bir log sətiri tapılmadı.</div>
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