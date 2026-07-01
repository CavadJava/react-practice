import { Link } from "react-router";

const DepositLeftMenu = () => {
    return (
        /* Sidebar */
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar vh-100 p-3 text-white collapse shadow">
          <h4 className="text-center mb-4 pb-2 border-bottom border-secondary fw-bold text-info">Admin Panel</h4>
          
          <ul className="nav flex-column gap-2">
            {/* 1. Ana Menyu: Dashboard */}
            <li className="nav-item">
              <a className="nav-link text-white active d-flex align-items-center gap-2 rounded bg-primary" href="/dashboard/bank/monitoring">
                <span>📊</span> Dashboard
              </a>
            </li>

            {/* 3. Ana Menyu (Açılan / Dropdown): Monitorinq & Resurslar */}
            <li className="nav-item">
              <a 
                className="nav-link text-white-50 d-flex align-items-center justify-content-between rounded" 
                data-bs-toggle="collapse" 
                href="#monitoringSubmenu" 
                role="button" 
                aria-expanded="false" 
                aria-controls="monitoringSubmenu"
              >
                <div className="d-flex align-items-center gap-2">
                  <span>⚙️</span> Servis İdarəetməsi
                </div>
                <span className="small">▼</span>
              </a>

              {/* Alt Menyu Elementləri (Sub Items) */}
              <div className="collapse ps-3 mt-1" id="monitoringSubmenu">
                <ul className="nav flex-column gap-1 border-start border-secondary ps-2">
                  <li className="nav-item">
                    <Link to={`/dashboard/bank/project/AA01`} className="nav-link text-white-50 py-1 small d-flex align-items-center gap-2">
                      🖥️ Resurslara Bax
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to={`/dashboard/bank/project/AA01/customers`} className="nav-link text-white-50 py-1 small d-flex align-items-center gap-2">
                      🗂️ Müştərilərə Bax
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to={`/dashboard/bank/project/deposit`} className="nav-link text-white-50 py-1 small d-flex align-items-center gap-2">
                      💰 Depozit Əməliyyatları
                    </Link>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </nav>
    );
}
export default DepositLeftMenu;