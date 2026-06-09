import React from 'react';
import { useParams } from 'react-router-dom';
import DepositLeftMenu from '../../menu/depositleftmenu';

// Yoxlamaq üçün mövcud layihələrimizin siyahısı (Real layihədə ortaq data faylından gəlməlidir)
const projectList = [
  { uniqueId: "AA01", name: 'Online Deposit Service' },
  { uniqueId: "AA02", name: 'OpenBanking Service' }
];

const LoggingPage: React.FC = () => {
  // 1. URL-dəki ":uniqueId" parametrini dinamik olaraq oxuyuruq
  const { uniqueId } = useParams<{ uniqueId: string }>();

  // 2. Həmin unikal ID-yə sahib olan layihəni tapırıq
  const currentProject = projectList.find(p => p.uniqueId === uniqueId);

  // 3. Əgər layihə tapılarsa onun rəsmi adını, tapılmazsa ID-nin özünü göstəririk
  const projectName = currentProject ? currentProject.name : `Layihə (${uniqueId})`;

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sol Menyu */}
        <DepositLeftMenu />
        
        {/* Əsas Log Paneli */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
            <h1 className="h2 text-dark">
              📋 Loglar: <span className="text-primary">{projectName}</span>
            </h1>
            <span className="badge bg-secondary font-monospace">UID: {uniqueId}</span>
          </div>
          
          <div className="alert alert-info shadow-sm" role="alert">
            <h4 className="alert-heading">Səhifə Hazırlanır</h4>
            <p className="mb-0 lead text-muted">
              {projectName} xidmətinə aid real zamanlı log məlumatları tezliklə burada göstəriləcək.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoggingPage;