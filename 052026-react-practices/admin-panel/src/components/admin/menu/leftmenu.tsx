import { useState } from "react";

const LeftMenu = () => {
  const [isBootstrapExampleOpen, setIsBootstrapExampleOpen] = useState(false);

  return (
      
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar vh-100 p-3 text-white collapse">
          <h4 className="text-center mb-4">Admin Panel</h4>
          <ul className="nav flex-column">
            <li className="nav-item">
              <a className="nav-link text-white active" href="/dashboard">Dashboard</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="/dashboard/users">İstifadəçilər</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="/dashboard/projects">Layihələr</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="/dashboard/companies">Şirkətlər</a>
            </li>
            
            {/* Dropdown Menu */}
            <li className="nav-item">
              <div className="nav-link text-white d-flex justify-content-between align-items-center"
              style={{cursor: 'pointer'}}
              onClick={() => setIsBootstrapExampleOpen(!isBootstrapExampleOpen)}
              >
                <span><i className="bi bi-gear me-2"></i>Bootstrap examples</span>
                <span>{isBootstrapExampleOpen? '▾' : '▸'}</span>
              </div>
              {/* Sub-items list */}
              {isBootstrapExampleOpen && (
                <ul className="nav flex-column ms-3 mt-1 transition">
                  <li className="nav-item">
                    <a className="nav-link text-white-50" href="/dashboard/cards/card01">Cards-1</a>
                  </li>
                </ul>
              )}
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="/dashboard/bank/monitoring">Mobile Layihələr</a>
            </li>
          </ul>
        </nav>
  );
};
export default LeftMenu;