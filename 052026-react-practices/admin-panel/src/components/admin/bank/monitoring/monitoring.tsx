import { Link } from "react-router";
import ProjectCard from "../project/projectcard";
import { projectsData } from "../project/projectsData";

const Monitoring = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar vh-100 p-3 text-white collapse shadow">
          <h4 className="text-center mb-4 pb-2 border-bottom border-secondary fw-bold text-info">Admin Panel</h4>
          
          <ul className="nav flex-column gap-2">
            {/* 1. Ana Menyu: Dashboard */}
            <li className="nav-item">
              <a className="nav-link text-white active d-flex align-items-center gap-2 rounded bg-primary" href="/dashboard">
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
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Xoş gəlmisiniz!</h1>
            </div>
            <div className="row">
                {projectsData.map((project) => (<ProjectCard
                        key={project.uniqueId} // DÜZƏLİŞ: React-in elementi izləməsi üçün əsl unikal ID-ni bura verdik
                        id={project.id}
                        uniqueId={project.uniqueId}
                        name={project.name}
                        status={project.status}
                        pid={project.pid}
                        path={project.path}
                        swaggerUrl={project.swaggerUrl}
                    />
                ))}
            </div>
        </main>
      </div>
    </div>
  )
}

export default Monitoring;