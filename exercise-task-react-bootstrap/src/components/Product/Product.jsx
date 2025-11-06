import React from "react";

function Product({name, description, year,image}) {
    return (
        <div className="card w-25 d-flex justify-content-center">
            <div className="card-body">
                <img src={image} className="card-img-top" alt="..." />
                <h5 className="card-title">{name}</h5>
                <p className="card-text">{description}</p>
                <p className="card-text">{year}</p>
            </div>
        </div>
    )
}
export default Product;