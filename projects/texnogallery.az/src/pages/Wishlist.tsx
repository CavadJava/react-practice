import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import ProductList from '../components/sections/ProductList';

function Wishlist() {
  const { wishlistItems } = useShop();

  return (
    <div className="main-content" style={{ padding: '40px', width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ textAlign: 'left' }}>
        <h2>Seçilmişlər 🔖</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Sizin bəyəndiyiniz və daha sonra almaq üçün yadda saxladığınız məhsullar.
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
          <h3 style={{ color: '#555', marginBottom: '16px' }}>Seçilmiş siyahınız boşdur</h3>
          <p style={{ color: '#888', marginBottom: '24px' }}>Məhsul kartlarındakı ürək ikonuna (və ya səhifədəki seçilmişlərə əlavə et düyməsinə) klikləyərək məhsulları bura əlavə edə bilərsiniz.</p>
          <Link to="/" style={{ padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            Məhsullara Bax
          </Link>
        </div>
      ) : (
        <ProductList title="" products={wishlistItems} />
      )}
    </div>
  );
}

export default Wishlist;
