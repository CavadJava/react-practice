import { Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import './ProductCard.css';

interface ProductCardProps {
  name: string;
  price: string | number;
  imageUrl: string;
  oldPrice?: string; 
  badge?: 'new' | 'discount' | string;
  description?: string;
}

function ProductCard({ name, price, imageUrl, oldPrice, badge, description }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the product page
    addToCart({ name, price, imageUrl, oldPrice, badge, description });
    alert(`"${name}" səbətə əlavə edildi!`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist({ name, price, imageUrl, oldPrice, badge, description });
  };

  const isLiked = isInWishlist(name);

  return (
    <Link to={`/product/${encodeURIComponent(name)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <div className="product-card">
        {badge && (
          <span className={`product-badge ${badge === 'new' ? 'badge-new' : 'badge-discount'}`}>
            {badge === 'new' ? 'Yeni' : badge}
          </span>
        )}
        
        {/* Wishlist Button */}
        <button 
          onClick={handleToggleWishlist}
          style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'white', border: '1px solid #ddd', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          {isLiked ? '❤️' : '🤍'}
        </button>

        <img src={imageUrl} alt={name} className="product-image" />
        <h4 className="product-name">{name}</h4>
        {description && <p className="product-description" style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', marginBottom: '8px' }}>{description}</p>}
        
        <div className="product-prices">
          {oldPrice && <p className="product-old-price">{oldPrice}</p>}
          <p className="product-current-price">{price}</p>
        </div>

        {/* Add to Cart Quick Button */}
        <button 
          onClick={handleAddToCart}
          style={{ width: '100%', padding: '10px', marginTop: '12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = '#dcfce7'}
          onMouseOut={(e) => e.currentTarget.style.background = '#f0fdf4'}
        >
          Səbətə At
        </button>
      </div>
    </Link>
  );
}

export default ProductCard;
