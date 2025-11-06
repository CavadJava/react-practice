import React from 'react';

function Card({title, text}) {
    return (
        <div className="card w-25 d-flex justify-content-center">
            <div className="card-body">
                <h5 className="card-title">{title}</h5>
                <p className="card-text">{text}</p>
                <a href="#" className="btn btn-primary">Go somewhere</a>
            </div>
        </div>
    );
}

export default Card;