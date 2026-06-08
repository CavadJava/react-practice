const User = () => {
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
                <li className="nav-item">
                <a className="nav-link text-white" href="/dashboard/projects">Layihələr</a>
                </li>
                <li className="nav-item">
                <a className="nav-link text-white" href="/dashboard/companies">Şirkətlər</a>
                </li>
            </ul>
            </nav>

        {/* Əsas Hissə */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">İstifadəçilər</h1>
          </div>

          {/* Kartlar (Statistika) */}
          <div className="row">
            <div className="col-md-4">
              <div className="card text-white bg-primary mb-3">
                <div className="card-body">
                  <h5 className="card-title">Aktiv İstifadəçilər</h5>
                  <p className="card-text">5,230 nəfər</p>
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
    )
}
export default User;