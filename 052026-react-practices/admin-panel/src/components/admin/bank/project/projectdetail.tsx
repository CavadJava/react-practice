import { Link, useParams } from "react-router";
import { projectsData } from "./projectsData";

const ProjectDetail = () => {
    const { uniqueId } = useParams();

    const project = projectsData.find((p) => p.uniqueId === uniqueId);

    if (!project) {
        return (
        <div className="container mt-5">
            <div className="alert alert-danger">Layihə tapılmadı!</div>
            <Link to="/dashboard/bank/monitoring" className="btn btn-primary">Geri Qayıt</Link>
        </div>
        );
    }else{
      console.log('Seçilmiş Layihə:', project); // Konsola layihə məlumatlarını yazdırırıq
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
        </div>
        
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