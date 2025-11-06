import React from 'react';

function Navbar() {
    return (
        <nav className='navbar navbar-expand-lg bg-body-tertiary mb-3 bg-light d-flex justify-content-around w-100'>
            <ul className='nav-list navbar-nav me-auto mb-2 mb-lg-0 w-100 d-flex justify-content-around'>
                <li className='nav-item'>
                    <a className='nav-link' href="#">Home</a>
                </li>
                <li className='nav-item'>
                    <a className='nav-link' href="#">Cars</a>
                </li>
                <li className='nav-item'>
                    <a className='nav-link' href="#">About</a>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar