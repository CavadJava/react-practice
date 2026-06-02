import './ProductCard.css';

interface ProductCardProps {
  name: string;
  price: string;
  imageUrl: string;
}

function ProductCard({ name, price, imageUrl }: ProductCardProps) {
  return (
    <div className="product-card">
      <img src={imageUrl} alt={name} className="product-image" />
      <h4 className="product-name">{name}</h4>
      <p className="product-price">{price}</p>
      {/* Additional product details can go here */}
    </div>
  );
}

export default ProductCard;
