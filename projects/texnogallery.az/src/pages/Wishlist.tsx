import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import ProductList from '../components/sections/ProductList';
import Breadcrumb, { type BreadcrumbItem } from '../components/common/Breadcrumb';

function Wishlist() {
  const { wishlistItems } = useShop();
  const wishCount = wishlistItems.length;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Əsas Səhifə', url: '/' },
    { label: `Seçilmişlər (${wishCount})` } // Say dinamik olaraq naviqasiya zəncirində əks olunur
  ];

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Breadcrumb items={breadcrumbItems} />

      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2>Seçilmişlər 🔖 ({wishCount})</h2> 
          <p style={{ color: '#666', marginTop: '10px' }}>
            Sizin bəyəndiyiniz və daha sonra almaq üçün yadda saxladığınız məhsullar.
          </p>
        </div>

        {wishCount === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
            <h3 style={{ color: '#555', marginBottom: '16px' }}>Seçilmiş siyahınız boşdur</h3>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              Məhsul kartlarındakı ürək ikonuna klikləyərək məhsulları bura əlavə edə bilərsiniz.
            </p>
            <Link to="/" style={{ padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              Məhsullara Bax
            </Link>
          </div>
        ) : (
          <ProductList title="" products={wishlistItems} />
        )}
      </div>
    </div>
  );
}

export default Wishlist;