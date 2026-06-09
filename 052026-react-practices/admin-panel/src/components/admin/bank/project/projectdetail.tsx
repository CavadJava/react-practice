import { Link, useParams } from "react-router";
import { projectsData } from "./projectsData";
import { useState } from "react";

const ProjectDetail = () => {
    const { uniqueId } = useParams();

    const project = projectsData.find((p) => p.uniqueId === uniqueId);
    
    // 2. Cədvəlin açıq və ya qapalı olmasını idarə edən state (Default olaraq açıq - true)
    const [showTables, setShowTables] = useState<boolean>(true)

    if (!project) {
        return (
        <div className="container mt-5">
            <div className="alert alert-danger">Layihə tapılmadı!</div>
            <Link to="/dashboard/bank/monitoring" className="btn btn-primary">Geri Qayıt</Link>
        </div>
        );
    }

    const isUp = project.status.toUpperCase() === 'UP';

    return (
      <div className="container mt-5">{/* Geri Düyməsi */}
      <Link to="/dashboard/bank/monitoring" className="btn btn-secondary mb-4">← Panelə Qayıt</Link>
      
      <div className="card shadow">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">{project.name}</h3>
          <span className={`badge ${isUp ? 'bg-success' : 'bg-danger'} fs-5`}>
            {project.status}
          </span>
        </div>
        
        <div className="card-body">
          <p className="lead text-muted">{project.description}</p>
          <hr />


          {/* 3. HIDE / SHOW DÜYMƏSİ */}
          <div className="d-flex justify-content-center mb-4">
            <button className="{`btn ${showTables ? 'btn-outline-secondary' : 'btn-secondary'} btn-sm px-4`}" onClick={() => setShowTables(!showTables)}>
              {showTables ? '👁️ Resurslari Gizlet' : '👁️ Resurslari Göstər'}
            </button>
          </div>

          {/* 4. ŞƏRTLİ RENDER (showTables true-dursa cədvəllər görünəcək) */}
          {showTables && (
            <div className="row">
            {/* Texniki Göstəricilər */}
            <div className="col-md-6">
              <h5>Sistem Məlumatları</h5>
              <table className="table table-bordered mt-3">
                <tbody>
                  <tr>
                    <th>PID</th>
                    <td>{project.pid}</td>
                  </tr>
                  <tr>
                    <th>Qovluq Yolu (Path)</th>
                    <td><code>{project.path}</code></td>
                  </tr>
                  <tr>
                    <th>Versiya</th>
                    <td><span className="badge bg-secondary">{project.version}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Resurs Göstəricilər */}
            <div className="col-md-6">
              <h5>Resurs və Server Vəziyyəti</h5>
              <table className="table table-bordered mt-3">
                <tbody>
                  <tr>
                    <th>CPU İstifadəsi</th>
                    <td>{project.cpuUsage}</td>
                  </tr>
                  <tr>
                    <th>Yaddaş (RAM)</th>
                    <td>{project.memoryUsage}</td>
                  </tr>
                  <tr>
                    <th>Son Yenilənmə (Deploy)</th>
                    <td>{project.lastDeployment}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
        
        {/* Card Footer */}
        <div className="card-footer bg-light">
          <a href={project.swaggerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success">
            Swagger Sənədlərini Aç (API)
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;