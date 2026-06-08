import React, { useState, useEffect } from 'react';

// 1. API-dan gələn cavabın (Response) tipini təyin edirik
interface CustomersResponse {
  result: number[]; // ID-lərdən ibarət massiv
  code: number;
  message: string;
}

const CustomersData: React.FC = () => {
  // 2. State-ləri təyin edirik: data, yüklənmə və xəta vəziyyətləri üçün
  const [customerIds, setCustomerIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Komponent ekrana çıxanda (mount olanda) API-a sorğu atırıq
  useEffect(() => {
    fetch('http://localhost:8080/backoffice/customers')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Serverlə əlaqə qurulmadı (Şəbəkə xətası)');
        }
        return response.json();
      })
      .then((data: CustomersResponse) => {
        if (data.code === 0) {
          setCustomerIds(data.result); // [275277, 30869, ...] massivini state-ə yazırıq
        } else {
          setError(data.message || 'Məlumat yüklənərkən xəta baş verdi.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // Boş massiv sorğunun yalnız 1 dəfə atılmasını təmin edir

  // 4. İstifadəçi təcrübəsi (UX) üçün yüklənmə və xəta ekranları
  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yüklənir...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <strong>Xəta:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
        <h2>Müştəri Siyahısı</h2>
        <span className="badge bg-primary fs-6">Cəmi: {customerIds.length}</span>
      </div>

      <table className="table table-striped table-hover mt-3 shadow-sm border">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Ad / Soyad</th>
            <th>Email</th>
            <th>Əlaqə Nömrəsi</th>
          </tr>
        </thead>
        <tbody>
          {/* 5. API-dan gələn ID-ləri dövrə (map) salaraq sətirləri yaradırıq */}
          {customerIds.map((id) => (
            <tr key={id}>
              <td className="fw-bold text-secondary">{id}</td>
              <td>Müştəri_{id}</td> {/* API-da ad olmadığı üçün unikal yer tutucu qoyduq */}
              <td className="text-muted">customer{id}@example.com</td>
              <td>---</td>
            </tr>
          ))}
          
          {/* Əgər siyahı boş gələrsə */}
          {customerIds.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-muted py-4">
                Sistemdə heç bir müştəri tapılmadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersData;