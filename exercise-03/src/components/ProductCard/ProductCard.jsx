import styles from "./ProductCard.module.css"
import TeslaImage from "../../assets/Tesla.png";

function ProductCard({product}) {
    return (
        <div className={styles.product_card}>
            <img src={TeslaImage} className={styles.product_image} />
            <h2>{product.name}</h2>
            <span>{product.price}</span>
        </div>
    );
}

export default ProductCard;