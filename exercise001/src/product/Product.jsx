import React from "react";
import productJson from './product.json'

function Product(){

    console.log(productJson);

    return (
        <div>
            {productJson.map((pd) => {
                return (
                    <div className="product" key={pd.id}>
                        <h1>{pd.id}</h1>
                        <p>{pd.name}</p>
                        <p>{pd.price}</p>
                        <button type="button" id={pd.id}>Product</button>
                    </div>
                );
            })}
        </div>
    );
}

export default Product