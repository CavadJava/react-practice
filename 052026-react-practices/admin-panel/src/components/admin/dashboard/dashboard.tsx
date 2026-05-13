import { useState } from "react";

const Dashboard = () => {

  const [isBootstrapExampleOpen, setIsBootstrapExampleOpen] = useState(false);
  

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar vh-100 p-3 text-white collapse">
          <h4 className="text-center mb-4">Admin Panel</h4>
          <ul className="nav flex-column">
            <li className="nav-item">
              <a className="nav-link text-white active" href="#">Dashboard</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="#">İstifadəçilər</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="#">Parametrlər</a>
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
          </ul>
        </nav>

        {/* Əsas Hissə */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Xoş gəlmisiniz!</h1>
          </div>

          {/* Kartlar (Statistika) */}
          <div className="row">
            <div className="col-md-4">
              <div className="card text-white bg-primary mb-3">
                <div className="card-body">
                  <h5 className="card-title">Satışlar</h5>
                  <p className="card-text">5,230 AZN</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white bg-success mb-3">
                <div className="card-body">
                  <h5 className="card-title">Yeni Müştərilər</h5>
                  <p className="card-text">145 nəfər</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;