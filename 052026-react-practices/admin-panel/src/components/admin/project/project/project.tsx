const Project = () => {
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
                <h1 className="h2">Proyektler</h1>
            </div>

            {/* Kartlar (Statistika) */}
            <div className="row">
                <table className="table">
                <thead>
                    <tr>
                    <th scope="col">#</th>
                    <th scope="col">First</th>
                    <th scope="col">Last</th>
                    <th scope="col">Handle</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <th scope="row">1</th>
                    <td>Mark</td>
                    <td>Otto</td>
                    <td>@mdo</td>
                    </tr>
                    <tr>
                    <th scope="row">2</th>
                    <td>Jacob</td>
                    <td>Thornton</td>
                    <td>@fat</td>
                    </tr>
                    <tr>
                    <th scope="row">3</th>
                    <td>Larry</td>
                    <td>the Bird</td>
                    <td>@twitter</td>
                    </tr>
                </tbody>
                </table>
            </div>
            </main>
        </div>
    </div>
  )
}
export default Project;