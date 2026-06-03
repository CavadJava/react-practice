import { Link } from 'react-router-dom';
import './ProductCard.css';

interface ProductCardProps {
  name: string;
  price: string;
  imageUrl: string;
  oldPrice?: string; // Optional old price for discounts
  badge?: 'new' | 'discount' | string; // Optional badge (e.g., 'new', '-500 ₼')
  description?: string; // Optional description
}

function ProductCard({ name, price, imageUrl, oldPrice, badge, description }: ProductCardProps) {
  return (
    <Link to={`/product/${encodeURIComponent(name)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <div className="product-card">
        {badge && (
          <span className={`product-badge ${badge === 'new' ? 'badge-new' : 'badge-discount'}`}>
            {badge === 'new' ? 'Yeni' : badge}
          </span>
        )}
        <img src={imageUrl} alt={name} className="product-image" />
        <h4 className="product-name">{name}</h4>
        {description && <p className="product-description" style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', marginBottom: '8px' }}>{description}</p>}
        <div className="product-prices">
          {oldPrice && <p className="product-old-price">{oldPrice}</p>}
          <p className="product-current-price">{price}</p>
        </div>
        {/* Additional product details can go here */}
      </div>
    </Link>
  );
}

export default ProductCard;
