import { useParams, useSearchParams } from 'react-router-dom';
import ProductList from '../components/sections/ProductList';

function Category() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sub = searchParams.get('sub');

  const categoryName = id ? decodeURIComponent(id) : 'Bütün Məhsullar';
  const subCategoryName = sub ? decodeURIComponent(sub) : null;

  // Placeholder products for the category page
  const categoryProducts = [
    { name: `${subCategoryName || categoryName} Məhsulu 1`, description: "Yüksək keyfiyyətli, uzun ömürlü məhsul.", price: "1500 ₼", imageUrl: "https://via.placeholder.com/150/EEEEEE/000000?text=Product+1", badge: 'yeni' },
    { name: `${subCategoryName || categoryName} Məhsulu 2`, description: "Gündəlik istifadə üçün ideal seçim.", price: "2300 ₼", oldPrice: "2500 ₼", imageUrl: "https://via.placeholder.com/150/DDDDDD/000000?text=Product+2", badge: '-200 ₼' },
    { name: `${subCategoryName || categoryName} Məhsulu 3`, description: "Kompakt və rahat istifadə edilə bilən cihaz.", price: "800 ₼", imageUrl: "https://via.placeholder.com/150/CCCCCC/000000?text=Product+3" },
    { name: `${subCategoryName || categoryName} Məhsulu 4`, description: "Premium dizayn və üstün performans.", price: "3200 ₼", imageUrl: "https://via.placeholder.com/150/BBBBBB/000000?text=Product+4", badge: 'populyar' },
  ];

  return (
    <div className="main-content" style={{ padding: '40px', textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2>Kategoriya: {categoryName}</h2>
        {subCategoryName && <h3>Alt Kategoriya: {subCategoryName}</h3>}
        <p style={{ marginTop: '10px', color: '#666' }}>Bu səhifədə seçilmiş kateqoriyaya aid məhsullar listələnir.</p>
      </div>
      
      <ProductList title={`${subCategoryName || categoryName} üçün nəticələr`} products={categoryProducts} />
    </div>
  );
}

export default Category;
