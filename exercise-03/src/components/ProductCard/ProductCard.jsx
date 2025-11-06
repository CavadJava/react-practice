import React from 'react';
import styles from "./ProductCard.module.css";
import TeslaImage from "../../assets/Tesla.png";
import EarphoneIcon from "../../assets/earphone.svg?react";
import {FaRegBell} from "react-icons/fa";

function ProductCard({name, description, price}) {
    return (
        <div className={styles.product_card}>
            <img  src={TeslaImage} alt="Product" className={styles.product_image} />
            <h2>{name}</h2>
            <p>{description}</p>
            <span>${price}</span>
            <EarphoneIcon width={40} height={40}/>
            <FaRegBell />
        </div>
    );
}

export default ProductCard;