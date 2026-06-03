import './ProductCard.css';

interface ProductCardProps {
  name: string;
  price: string;
  imageUrl: string;
  oldPrice?: string; // Optional old price for discounts
  badge?: 'new' | 'discount' | string; // Optional badge (e.g., 'new', '-500 ₼')
}

function ProductCard({ name, price, imageUrl, oldPrice, badge }: ProductCardProps) {
  return (
    <div className="product-card">
      {badge && (
        <span className={`product-badge ${badge === 'new' ? 'badge-new' : 'badge-discount'}`}>
          {badge === 'new' ? 'Yeni' : badge}
        </span>
      )}
      <img src={imageUrl} alt={name} className="product-image" />
      <h4 className="product-name">{name}</h4>
      <div className="product-prices">
        {oldPrice && <p className="product-old-price">{oldPrice}</p>}
        <p className="product-current-price">{price}</p>
      </div>
      {/* Additional product details can go here */}
    </div>
  );
}

export default ProductCard;
