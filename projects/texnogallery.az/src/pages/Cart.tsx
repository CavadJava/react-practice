import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useShop();

  const shipping = cartTotal > 0 ? 10 : 0; // Şərti çatdırılma qiyməti
  const total = cartTotal + shipping;

  return (
    <div className="main-content" style={{ padding: '40px', width: '100%', display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
      <h2>Səbətiniz</h2>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
          <h3 style={{ color: '#555', marginBottom: '16px' }}>Səbətiniz boşdur 🛒</h3>
          <p style={{ color: '#888', marginBottom: '24px' }}>Bəyəndiyiniz məhsulları tapmaq üçün ana səhifəyə və ya axtarışa keçin.</p>
          <Link to="/" style={{ padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            Alış-verişə Başla
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* Səbət məhsulları siyahısı */}
          <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '20px', padding: '20px', backgroundColor: 'white', border: '1px solid #eee', borderRadius: '12px', alignItems: 'center' }}>
                <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#f9f9f9' }} />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link to={`/product/${encodeURIComponent(item.name)}`} style={{ textDecoration: 'none', color: 'var(--text-dark)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {item.name}
                  </Link>
                  <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {item.price}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '8px 12px', border: 'none', backgroundColor: '#f9f9f9', cursor: 'pointer', fontSize: '1rem' }}>-</button>
                    <div style={{ padding: '8px 16px', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
                      {item.quantity}
                    </div>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '8px 12px', border: 'none', backgroundColor: '#f9f9f9', cursor: 'pointer', fontSize: '1rem' }}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ padding: '10px', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Sil">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sifarişin icmalı (Order Summary) */}
          <div style={{ flex: '1 1 300px', maxWidth: '400px', backgroundColor: '#f9f9f9', padding: '24px', borderRadius: '12px', border: '1px solid #eee', position: 'sticky', top: '90px' }}>
            <h3 style={{ marginBottom: '24px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>Sifariş İcmalı</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                <span>Məhsullar ({cartItems.reduce((acc, i) => acc + i.quantity, 0)}):</span>
                <span>{cartTotal} ₼</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                <span>Çatdırılma:</span>
                <span>{shipping} ₼</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '16px', marginBottom: '24px', color: 'var(--text-dark)' }}>
              <span>Cəmi:</span>
              <span style={{ color: 'var(--primary-color)' }}>{total} ₼</span>
            </div>

            <button style={{ width: '100%', padding: '14px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
              Sifarişi Rəsmiləşdir
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default Cart;