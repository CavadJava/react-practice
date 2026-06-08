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
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                        {/* Project Name */}
                        <h5 className="card-title">Online Deposit Service</h5>
                        
                        <div className="card-text my-3">
                            {/* Status */}
                            <div className="mb-2">
                                <strong>Status:</strong> <span className="badge bg-success">UP</span> {/* Change to bg-danger for DOWN */}
                            </div>
                            {/* PID */}
                            <div className="mb-2">
                                <strong>PID:</strong> <span>14208</span>
                            </div>
                            {/* Path */}
                            <div className="mb-2">
                                <strong>Path:</strong> <code>/var/www/online-deposit</code>
                            </div>
                        </div>
                        {/* Swagger Link */}
                        <a href="http://localhost:8383/online-deposit/swagger-ui/index.html" className="btn btn-primary w-100" target="_blank" rel="noopener noreferrer">
                            Swagger Docs
                        </a>
                    </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                        {/* Project Name */}
                        <h5 className="card-title">Openbanking Service</h5>
                        
                        <div className="card-text my-3">
                            {/* Status */}
                            <div className="mb-2">
                                <strong>Status:</strong> <span className="badge bg-success">UP</span> {/* Change to bg-danger for DOWN */}
                            </div>
                            {/* PID */}
                            <div className="mb-2">
                                <strong>PID:</strong> <span>14208</span>
                            </div>
                            {/* Path */}
                            <div className="mb-2">
                                <strong>Path:</strong> <code>/var/www/online-deposit</code>
                            </div>
                        </div>
                        {/* Swagger Link */}
                        <a href="http://localhost:8383/online-deposit/swagger-ui/index.html" className="btn btn-primary w-100" target="_blank" rel="noopener noreferrer">
                            Swagger Docs
                        </a>
                    </div>
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  )
}

export default Monitoring;