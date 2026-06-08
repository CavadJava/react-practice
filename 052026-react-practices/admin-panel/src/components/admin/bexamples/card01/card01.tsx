import cardStyles from './card01.module.css'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useState } from 'react';
const Card01 = () => {
  const [isBootstrapExampleOpen, setIsBootstrapExampleOpen] = useState(false);
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
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
          <div className={cardStyles.card01}>
            {/* <img className="card-img-top" src="..." alt="Card image cap"> */}
            <div className="card-body">
                <h5 className="card-title">Card title</h5>
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="#" className="btn btn-primary">Go somewhere</a>
            </div>
        </div>
      </main>
      </div>
    </div>
  );
}

export default Card01;