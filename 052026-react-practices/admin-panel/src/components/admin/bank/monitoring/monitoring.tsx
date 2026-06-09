import { Link } from "react-router";
import ProjectCard from "../project/projectcard";
import { projectsData } from "../project/projectsData";
import DepositLeftMenu from "../../menu/depositleftmenu";

const Monitoring = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <DepositLeftMenu/>
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