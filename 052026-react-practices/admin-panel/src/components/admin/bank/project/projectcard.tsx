import React from 'react';
import { Link } from 'react-router';

// TypeScript üçün gələn dataların tiplərini təyin edirik
interface ProjectCardProps {
  name: string;
  status: 'UP' | 'DOWN' | string;
  pid: number | string;
  path: string;
  swaggerUrl: string;
  id: number;
  uniqueId: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ id, uniqueId, name, status, pid, path, swaggerUrl }) => {
  const isUp = status.toUpperCase() === 'UP';

  return (
    <div className="col-md-4 mb-4">
      <div className="card shadow-sm">
        <div className="card-body">
          {/* Project Name */}
          <h5 className="card-title text-truncate">{name}</h5>
          
          <div className="card-text my-3">
            {/* Status */}
            <div className="mb-2">
              <strong>Status:</strong>{' '}
              <span className={`badge ${isUp ? 'bg-success' : 'bg-danger'}`}>
                {status.toUpperCase()}
              </span>
            </div>
            
            {/* PID */}
            <div className="mb-2">
              <strong>PID:</strong> <span>{pid}</span>
            </div>
            
            {/* Path */}
            <div className="mb-2">
              <strong>Path:</strong> <code className="text-break">{path}</code>
            </div>
          </div>

          {/* Swagger Link */}
          <a 
            href={swaggerUrl} 
            className="btn btn-primary w-100" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Swagger Docs
          </a>
         <Link to={`/dashboard/bank/project/${uniqueId}`} className="btn btn-outline-primary w-100">
            Resurslara Bax
         </Link>
         <Link to={`/dashboard/bank/project/${uniqueId}/customers`} className="btn btn-outline-secondary w-100 mt-2">
            Musterilere Bax
         </Link>
          
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;