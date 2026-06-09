import React from 'react';
import CustomerV1 from '../customer/customerv1';
import IntegrationV1 from './integration';
import DepositLeftMenu from '../../../menu/depositleftmenu';
import ApplicationData from './applicationdata';


const DepositPage: React.FC = () => {
  return (
    <div className="container-fluid">

    {/* <div className="container mt-4 mb-5"> */}
      <div className="row">

        <DepositLeftMenu />
        

        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">

          <h2 className="mb-4 text-secondary border-bottom pb-2 fw-bold">Backoffice Monitorinq Paneli</h2>

      {/* ========================================================
          1. CƏDVƏL: CUSTOMER TABLE (Real API)
         ======================================================== */}
      <CustomerV1 />

      {/* ========================================================
          2. CƏDVƏL: INTEGRATION TABLE (Sənin kodundakı struktur)
         ======================================================== */}
      <IntegrationV1 />

      {/* ========================================================
          3. CƏDVƏL: APPLICATION TABLE (Kənara klikləyəndə aktivləşir)
         ======================================================== */}
      <ApplicationData />

      </main>
      </div>

    </div>
  );
};

export default DepositPage;