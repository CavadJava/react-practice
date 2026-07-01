import { useSearchParams } from 'react-router-dom';
import ProductList from '../components/sections/ProductList';

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // Mock data to simulate search results
  const allProducts = [
    { name: "iPhone 15 Pro Max, 256 GB, Black Titanium", description: "Apple-in ən güclü flaqmanı.", price: "3299 ₼", imageUrl: "https://via.placeholder.com/150/111111/FFFFFF?text=iPhone+15", badge: 'yeni' },
    { name: "iPhone 14 Pro, 128 GB, Deep Purple", description: "Mükəmməl kamera və performans.", price: "2499 ₼", oldPrice: "2799 ₼", imageUrl: "https://via.placeholder.com/150/4B0082/FFFFFF?text=iPhone+14", badge: '-300 ₼' },
    { name: "Samsung Galaxy S24 Ultra, 512 GB", description: "S Pen ilə təchiz olunmuş premium smartfon.", price: "3199 ₼", imageUrl: "https://via.placeholder.com/150/DDDDDD/000000?text=S24+Ultra" },
    { name: "ASUS ROG Strix G16", description: "Oyun və render üçün güclü noutbuk.", price: "2599 ₼", imageUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=ASUS+ROG", badge: 'populyar' },
    { name: "MacBook Air M3, 15-inch, 512GB", description: "İncə, yüngül və sürətli.", price: "3499 ₼", imageUrl: "https://via.placeholder.com/150/CCCCCC/000000?text=MacBook+Air", badge: 'yeni' },
    { name: "Lenovo Legion Pro 5", description: "Professional oyunçular üçün.", price: "2649 ₼", oldPrice: "2799 ₼", imageUrl: "https://via.placeholder.com/150/FFFF00/000000?text=Lenovo" },
    { name: "AirPods Pro (2nd generation)", description: "Aktiv səs izolyasiyası ilə qulaqlıq.", price: "599 ₼", imageUrl: "https://via.placeholder.com/150/FFFFFF/000000?text=AirPods", badge: 'populyar' },
    { name: "Apple Watch Series 9", description: "Sağlamlığınız üçün ən yaxşı köməkçi.", price: "999 ₼", oldPrice: "1199 ₼", imageUrl: "https://via.placeholder.com/150/FF0000/FFFFFF?text=Apple+Watch", badge: '-200 ₼' },
  ];

  // Simple filtering logic (case-insensitive)
  const filteredProducts = query 
    ? allProducts.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) || 
        product.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="main-content" style={{ padding: '40px', width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2>Axtarış Nəticələri</h2>
        {query ? (
          <p style={{ color: '#666', marginTop: '10px' }}>
            "{query}" üçün <strong>{filteredProducts.length}</strong> nəticə tapıldı.
          </p>
        ) : (
          <p style={{ color: '#666', marginTop: '10px' }}>
            Axtarış üçün yuxarıdakı axtarış çubuğuna mətn daxil edin.
          </p>
        )}
      </div>

      {filteredProducts.length > 0 ? (
        <ProductList title="" products={filteredProducts} />
      ) : query ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
          <h3 style={{ color: '#555' }}>Uyğun məhsul tapılmadı</h3>
          <p style={{ color: '#888', marginTop: '10px' }}>Zəhmət olmasa fərqli açar sözlərlə yenidən cəhd edin.</p>
        </div>
      ) : null}
    </div>
  );
}

export default Search;
