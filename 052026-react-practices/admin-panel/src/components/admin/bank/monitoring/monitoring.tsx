import ProjectCard from "../project/projectcard";
import { projectsData } from "../project/projectsData";

const Monitoring = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar vh-100 p-3 text-white collapse">
          <h4 className="text-center mb-4">Admin Panel</h4>
          <ul className="nav flex-column">
            <li className="nav-item">
              <a className="nav-link text-white active" href="/dashboard">Dashboard</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="/dashboard/users">İstifadəçilər</a>
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